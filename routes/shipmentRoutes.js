const express = require('express');
const router = express.Router();
const shipmentController = require('../controller/shipmentController');
const authenticate = require('../middleware/auth');

router.post('/createShipments',authenticate, shipmentController.createShipment);
router.get('/getShipments',authenticate, shipmentController.getMyShipments);
router.put('/shipments/:id/status', authenticate, shipmentController.updateShipmentStatus);

// Test endpoint to verify database connection
router.get('/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({ 
      status: 'success', 
      database: states[dbState] || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
