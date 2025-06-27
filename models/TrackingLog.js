const mongoose = require('mongoose');

const trackingLogSchema = new mongoose.Schema({
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true
  },
  status: {
    type: String,
    enum: ['Created', 'Shipped', 'Dispatched', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'Returned', 'Cancelled'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    lat: Number,
    lng: Number
  },
  note: {
    type: String // Optional message, e.g. "Left at gate"
  }
});

module.exports = mongoose.model('TrackingLog', trackingLogSchema);
