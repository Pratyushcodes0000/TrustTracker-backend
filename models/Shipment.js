const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sellerGoogleId: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  customerAddress: {
    type: String,
    required: true,
  },
  courierName: {
    type: String,
    required:true // e.g., Delhivery, Dunzo, Manual
  },
  courierSlug: {
    type: String,
    required: true
  }, // Added for AfterShip (e.g., "delhivery")
  trackingId: {
    type: String,
    required:true // Courier tracking ID or internal
  },
  internalTrackingCode: {
    type: String,
    unique: true,
    required: false,
  },
  currentStatus: {
    type: String,
    enum: ['Created', 'Shipped', 'Dispatched', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'Returned', 'Cancelled'],
    default: 'Created',
  },
  deliveryDate: Date,
  proofOfDelivery: {
    photoUrl: String,
    uploadedAt: Date,
  },
  logs: [
    {
      status: String,
      timestamp: Date,
      location: {
        lat: Number,
        lng: Number
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
