const Shipment = require('../models/Shipment');
const TrackingLog = require('../models/TrackingLog');
const generateTrackingId = require('../utils/generateTrackingId');
const { sendWhatsApp, getMessageTemplate } = require('../services/notificationService');
const axios = require('axios')


const headers = {
  'aftership-api-key': process.env.AFTERSHIP_API_KEY,
  'Content-Type': 'application/json',
};

exports.createShipment = async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerAddress,
    courierName,
    courierSlug,
    trackingId
  } = req.body;

  try {
    // Skip AfterShip if courier is manual
    if (courierName && courierName.toLowerCase() !== 'manual' && trackingId) {
      await axios.post('https://api.aftership.com/v4/trackings', {
        tracking: {
          slug: courierSlug,
          tracking_number: trackingId,
        }
      }, { headers });
    }

    // Save shipment in MongoDB
    const shipment = await Shipment.create({
      sellerGoogleId: req.user.sellerGoogleId,
      customerName,
      customerPhone,
      customerAddress,
      courierName,
      courierSlug,
      trackingId,
      internalTrackingCode: generateTrackingId(),
      currentStatus: 'Created',
    });

    res.status(201).json({ message: 'Shipment created', data: shipment });
  } catch (err) {
    console.error('Error creating shipment:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to create shipment' });
  }
};


exports.getMyShipments = async (req, res) => {
  try {
    // `req.user.googleId` is available from the authentication middleware
    const shipments = await Shipment.find({ sellerGoogleId: req.user.sellerGoogleId }).sort({ createdAt: -1 });
    
    res.json({ success: true, shipments });
  } catch (err) {
    console.error('Error fetching shipments:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    shipment.currentStatus = status;
    if (status === 'Delivered') {
      shipment.deliveryDate = new Date();
    }

    await shipment.save();

    const log = new TrackingLog({
      shipment: shipment._id,
      status,
      note: note || '',
    });

    await log.save();

    const message = getMessageTemplate(shipment, status, req.user.name);
    await sendWhatsApp(shipment.customerPhone, message);

    res.status(200).json({ success: true, shipment });
  } catch (err) {
    console.error('❌ Error updating status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.getShipmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }
    res.json({ success: true, shipment });
  } catch (err) {
    console.error('❌ Error fetching shipment:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
