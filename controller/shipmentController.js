const Shipment = require('../models/Shipment');
const TrackingLog = require('../models/TrackingLog');
const generateTrackingId = require('../utils/generateTrackingId');
const { sendWhatsApp, getMessageTemplate } = require('../services/notificationService');
const axios = require('axios')

// Check if AfterShip API key is configured
const AFTERSHIP_API_KEY = process.env.AFTERSHIP_API_KEY;
const headers = {
  'aftership-api-key': AFTERSHIP_API_KEY,
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

  // Validate required fields
  if (!customerName || !customerPhone || !customerAddress || !courierSlug) {
    console.error('❌ Missing required fields:', { customerName, customerPhone, customerAddress, courierSlug });
    return res.status(400).json({ 
      error: 'Missing required fields. Please provide customerName, customerPhone, customerAddress, and courierSlug.' 
    });
  }

  // Validate sellerGoogleId is present
  if (!req.user || !req.user.sellerGoogleId) {
    console.error('❌ Missing sellerGoogleId in user object:', req.user);
    return res.status(401).json({ error: 'User authentication required' });
  }

  console.log('📦 Creating shipment with data:', {
    customerName,
    customerPhone,
    customerAddress,
    courierName,
    courierSlug,
    trackingId,
    sellerGoogleId: req.user.sellerGoogleId
  });

  // Set courierName if not provided
  const finalCourierName = courierName || (courierSlug === 'manual' ? 'Manual' : courierSlug);

  try {
    // Skip AfterShip if courier is manual or if API key is not configured
    if (finalCourierName && finalCourierName.toLowerCase() !== 'manual' && trackingId && AFTERSHIP_API_KEY) {
      console.log('🚚 Calling AfterShip API...');
      try {
        await axios.post('https://api.aftership.com/v4/trackings', {
          tracking: {
            slug: courierSlug,
            tracking_number: trackingId,
          }
        }, { headers });
        console.log('✅ AfterShip API call successful');
      } catch (aftershipError) {
        console.error('⚠️ AfterShip API call failed:', aftershipError.response?.data || aftershipError.message);
        // Continue with shipment creation even if AfterShip fails
      }
    } else {
      if (!AFTERSHIP_API_KEY) {
        console.log('⏭️ Skipping AfterShip API call (API key not configured)');
      } else {
        console.log('⏭️ Skipping AfterShip API call (manual courier or no tracking ID)');
      }
    }

    // Generate internal tracking code
    const internalTrackingCode = generateTrackingId();
    console.log('🔢 Generated tracking code:', internalTrackingCode);

    // Save shipment in MongoDB
    console.log('💾 Saving shipment to database...');
    const shipment = await Shipment.create({
      sellerGoogleId: req.user.sellerGoogleId,
      customerName,
      customerPhone,
      customerAddress,
      courierName: finalCourierName,
      courierSlug,
      trackingId,
      internalTrackingCode,
      currentStatus: 'Created',
    });

    console.log('✅ Shipment created successfully:', shipment._id);
    res.status(201).json({ message: 'Shipment created', data: shipment });
  } catch (err) {
    console.error('❌ Error creating shipment:', err);
    console.error('❌ Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    
    if (err.name === 'ValidationError') {
      console.error('❌ Validation errors:', err.errors);
      return res.status(400).json({ error: err.message });
    }
    
    if (err.code === 11000) {
      console.error('❌ Duplicate key error:', err.keyValue);
      return res.status(400).json({ error: 'Duplicate tracking code generated. Please try again.' });
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

exports.getShipmentByTrackingCode = async (req, res) => {
  const { trackingCode } = req.params;

  try {
    console.log('🔍 Looking up shipment with tracking code:', trackingCode);
    
    // Find shipment by internal tracking code
    const shipment = await Shipment.findOne({ internalTrackingCode: trackingCode });
    
    if (!shipment) {
      console.log('❌ Shipment not found for tracking code:', trackingCode);
      return res.status(404).json({ 
        success: false, 
        message: 'Shipment not found' 
      });
    }

    // Get tracking logs for this shipment
    const logs = await TrackingLog.find({ shipment: shipment._id })
      .sort({ timestamp: -1 }); // Most recent first

    console.log('✅ Shipment found:', shipment.internalTrackingCode);
    console.log('📋 Found', logs.length, 'tracking logs');

    // Format the response for the tracking page
    const trackingData = {
      internalTrackingCode: shipment.internalTrackingCode,
      customerName: shipment.customerName,
      courierName: shipment.courierName,
      trackingId: shipment.trackingId,
      currentStatus: shipment.currentStatus,
      deliveryDate: shipment.deliveryDate,
      createdAt: shipment.createdAt,
      logs: logs.map(log => ({
        status: log.status,
        timestamp: log.timestamp,
        note: log.note,
        location: log.location
      }))
    };

    res.json(trackingData);
  } catch (err) {
    console.error('❌ Error fetching shipment by tracking code:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};
