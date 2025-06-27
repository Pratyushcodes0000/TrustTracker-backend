// middleware/auth.js
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const client = new OAuth2Client(
  '908385555062-qhajjb6pk2o8jkpc9a8mdumt52rd582b.apps.googleusercontent.com'
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
      audience: '908385555062-qhajjb6pk2o8jkpc9a8mdumt52rd582b.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();
    const user = await User.findOne({ sellerGoogleId: payload.sub });

    if (!user) {
      console.log('🚫 No user found with googleId:', payload.sub);
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authenticate;
