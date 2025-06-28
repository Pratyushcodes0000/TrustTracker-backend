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
    console.log('🔍 Verifying token...');
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  
    const payload = ticket.getPayload();
    console.log('✅ Token verified successfully');
    console.log('✅ Token audience:', payload.aud);
    console.log('✅ Expected audience:', process.env.GOOGLE_CLIENT_ID);
    console.log('✅ Token expires at:', new Date(payload.exp * 1000));
  
    const user = await User.findOne({ sellerGoogleId: payload.sub });
    if (!user) {
      console.log('❌ User not found for Google ID:', payload.sub);
      return res.status(401).json({ error: 'User not found' });
    }
  
    console.log('✅ User authenticated:', user.name);
    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err.message);
    
    // Provide more specific error messages
    if (err.message.includes('Token used too late')) {
      return res.status(401).json({ error: 'Token has expired' });
    } else if (err.message.includes('Invalid audience')) {
      return res.status(401).json({ error: 'Invalid token audience' });
    } else if (err.message.includes('Invalid signature')) {
      return res.status(401).json({ error: 'Invalid token signature' });
    }
    
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authenticate;
