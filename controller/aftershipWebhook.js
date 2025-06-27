const Shipment = require('../models/Shipment');
const crypto = require('crypto');
require('dotenv').config();

const AFTERSHIP_WEBHOOK_SECRET = process.env.AFTERSHIP_WEBHOOK_SECRET; // move to .env in production

exports.handleAfterShipWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-af-webhook-signature'];

    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', AFTERSHIP_WEBHOOK_SECRET);
    hmac.update(payload);
    const generatedSignature = hmac.digest('hex');

    if (signature !== generatedSignature) {
      console.warn('⚠️ Webhook signature mismatch. Ignoring request.');
      return res.status(401).send('Unauthorized');
    }

    // Proceed if signature is valid
    const { tracking } = req.body;

    if (tracking) {
      const { tracking_number, slug, tag, checkpoints } = tracking;

      const logs = checkpoints.map(cp => ({
        status: cp.tag,
        timestamp: new Date(cp.checkpoint_time),
        location: {
          lat: null,
          lng: null
        }
      }));

      const updated = await Shipment.findOneAndUpdate(
        { trackingId: tracking_number, courierSlug: slug },
        {
          currentStatus: tag,
          logs,
        },
        { new: true }
      );

      console.log(`✅ Webhook verified & updated shipment: ${updated?.trackingId} → ${tag}`);
    }

    res.status(200).send('Webhook processed');
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).send('Webhook failed');
  }
};
