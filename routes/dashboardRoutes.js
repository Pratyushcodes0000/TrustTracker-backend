const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');
const auth = require('../middleware/auth')

router.get('/dashboard',auth, dashboardController.getDashboardStats);

module.exports = router;
