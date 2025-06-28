const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.Login = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'No ID token provided' });
  }

  try {
    // 🔐 Verify token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // 🔍 Check if user already exists
    let user = await User.findOne({ sellerGoogleId: sub });

    // 👤 If user doesn't exist, create new one
    if (!user) {
      try {
        user = await User.create({
          sellerGoogleId: sub,
          name,
          email,
          profileImage: picture,
        });
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ message: 'A user with this email already exists.' });
        }
        console.error('❌ Error creating user:', err);
        return res.status(500).json({ message: 'Error creating user' });
      }
    }

    // ✅ Login successful, send user data
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        sellerGoogleId: user.sellerGoogleId,
      },
    });
  } catch (err) {
    console.error('❌ Invalid Google token:', err);
    return res.status(401).json({ message: 'Invalid Google token' });
  }
};

exports.validateToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (authenticate middleware passed)
    res.status(200).json({ 
      success: true, 
      message: 'Token is valid',
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profileImage: req.user.profileImage,
        sellerGoogleId: req.user.sellerGoogleId,
      }
    });
  } catch (err) {
    console.error('❌ Token validation error:', err);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
