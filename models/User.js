const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  sellerGoogleId: { type: String, required: true, unique: true, sparse: true },
  
  name: {
    type: String,
    required: true,
  }, 
  phone: {
    type: String,
    unique: true,
    required: false,
    sparse: true,
  },
  email:{
   type:String,
   unique:false,
   required:false
  },
  profileImage: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
