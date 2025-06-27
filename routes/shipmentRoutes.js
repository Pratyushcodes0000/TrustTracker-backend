const express = require('express');
const router = express.Router();
const shipmentController = require('../controller/shipmentController');
const authenticate = require('../middleware/auth');

router.post('/createShipments',authenticate, shipmentController.createShipment);
router.get('/getShipments',authenticate, shipmentController.getMyShipments);
router.put('/shipments/:id/status', authenticate, shipmentController.updateShipmentStatus);


module.exports = router;
