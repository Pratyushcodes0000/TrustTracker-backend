const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config(); // Load environment variables

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'GOOGLE_CLIENT_ID'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

console.log('✅ Environment variables validated');

connectDB();

//import routes here
const shipmentRoutes = require('./routes/shipmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');    
const LoginRoutes = require('./routes/LoginRoute');
const aftershipRoutes = require('./routes/aftershipRoutes');


const cors = require('cors');
const http = require('http');
const app = express();

app.use(cors({
    origin: ['http://localhost:5173','https://trust-tracker-web-frontend.vercel.app'], // Replace with your React app's port
    credentials: true
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//routes
app.use('/api', shipmentRoutes);
app.use('/api', dashboardRoutes);
app.use('/api',LoginRoutes);
app.use('/api', aftershipRoutes);


//create  http server
const server = http.createServer(app);
server.listen(8000,async ()=>{
    console.log(`Server started on http://localhost:${8000}`);

    
    
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});