const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config(); // Load environment variables

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
    origin: 'http://localhost:5173', // Replace with your React app's port
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