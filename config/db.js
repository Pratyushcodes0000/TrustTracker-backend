const mongoose = require('mongoose')

const connectDB =async ()=>{
    try {
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017/TrustTracker',{
            useNewUrlParser:true,
            useUnifiedTopology: true // ✅ recommended
        });
        console.log(`MongoDB connected:${conn.connection.host}`);
    } catch (error) {
        console.error(error)
        process.exit(1);
    }
}
module.exports = connectDB;