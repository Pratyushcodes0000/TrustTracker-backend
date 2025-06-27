const axios = require('axios');
const qs = require('qs');


exports.sendWhatsApp = async (to, message) => {
  try {
    const payload = qs.stringify({
      channel: 'whatsapp',
      source: '917834811114', 
      destination: `91${to}`, 
      message,
      'src.name': 'TrustTrack' 
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apikey': 'vr0ran7ja5vmpnjf3znui4ocnukhuxq1' 
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

  const publicLink = `https://trusttrack.in/track/${shipment.internalTrackingCode}`;
  const tempLink  =  `http://localhost:8000/api/track/${shipment.internalTrackingCode}`;

  return `📦 Hello ${shipment.customerName}, your order is now *${status}*.

Tracking ID: ${shipment.internalTrackingCode}
Status: ${status}
Track here: ${tempLink}

Thank you for shopping with ${sellerName || 'our store'}!`;
};
