const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
require('dotenv').config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

exports.Login = async (req, res) => {
  console.log('🔍 LoginController.Login called');
  const { idToken } = req.body;
  console.log('📝 Received idToken:', idToken ? 'Present' : 'Missing');
  
  if (!idToken) {
    console.log('❌ No ID token provided');
    return res.status(400).json({ message: 'No ID token provided' });
  }

  try {
    console.log('🔐 Verifying Google token...');
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;
    console.log('✅ Google token verified. User:', { sub, email, name });

    console.log('🔍 Looking for user with googleId:', sub);
    let user = await User.findOne({ sellerGoogleId: sub });

    if (!user) {
      console.log('👤 User not found, creating new user...');
      try {
        user = await User.create({
          sellerGoogleId: sub,
          name,
          email,
          profileImage: picture,
        });
        console.log('✅ New user created:', user.email);
      } catch (creationError) {
        console.error('❌ Error creating new user:', creationError.message);
        // This can happen if a user with the same email already exists
        if (creationError.code === 11000) { // E11000 is the duplicate key error code
          return res.status(409).json({ message: 'A user with this email already exists.' });
        }
        throw creationError; // Re-throw other errors
      }
    } else {
      console.log('✅ Existing user found:', user.email);
    }

    // ✅ No custom JWT — just send back user info
    console.log('📤 Sending response with user data');
    return res.json({
      success: true,
      googleToken: idToken, // Client already has this, but okay to echo
      userId: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    });
  } catch (err) {
    console.error('❌ Google Auth Error:', err);
    return res.status(401).json({ message: 'Invalid Google token' });
  }
};
