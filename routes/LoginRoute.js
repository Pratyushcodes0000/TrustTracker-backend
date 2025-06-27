const express = require('express');
const router = express.Router();

const LoginController = require('../controller/LoginController')

router.post('/login',LoginController.Login)

module.exports = router;