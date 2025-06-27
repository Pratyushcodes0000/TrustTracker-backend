const express = require('express');
const router = express.Router();
const aftershipWebhook = require('../controller/aftershipWebhook');

router.post('/aftership/webhook', aftershipWebhook.handleAfterShipWebhook);

module.exports = router;