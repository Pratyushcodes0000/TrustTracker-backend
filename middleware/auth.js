// middleware/auth.js
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
require('dotenv').config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    console.log('🚫 No token provided in Authorization header');
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  
    const payload = ticket.getPayload();
    console.log('✅ Token audience:', payload.aud);
    console.log('✅ Expected audience:', process.env.GOOGLE_CLIENT_ID);
  
    const user = await User.findOne({ sellerGoogleId: payload.sub });
    if (!user) return res.status(401).json({ error: 'User not found' });
  
    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authenticate;
