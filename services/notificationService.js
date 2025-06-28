const axios = require('axios');
const qs = require('qs');
require('dotenv').config();


exports.sendWhatsApp = async (to, message) => {
  try {
    const payload = qs.stringify({
      channel: 'whatsapp',
      source: process.env.WHATSAPP_SOURCE_NUMBER, 
      destination: `91${to}`, 
      message,
      'src.name': 'TrustTrack' 
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apikey': process.env.WHATSAPP_API_KEY 
    };

    const response = await axios.post(
      'https://api.gupshup.io/sm/api/v1/msg',
      payload,
      { headers }
    );

    console.log(`✅ WhatsApp message sent to ${to}:`, response.data);
  } catch (error) {
    console.error('❌ WhatsApp send error:', error.response?.data || error.message);
  }
};


exports.getMessageTemplate = (shipment, status, sellerName) => {
  // Use the actual frontend URL for tracking
  const trackingLink = `https://trust-tracker-web-frontend.vercel.app/track?id=${shipment.internalTrackingCode}`;

  return `📦 Hello ${shipment.customerName}, your order is now *${status}*.

Tracking ID: ${shipment.internalTrackingCode}
Status: ${status}
Track here: ${trackingLink}

Thank you for shopping with ${sellerName || 'our store'}!`;
};
