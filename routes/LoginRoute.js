const express = require('express');
const router = express.Router();

const LoginController = require('../controller/LoginController')
const authenticate = require('../middleware/auth');

router.post('/login', LoginController.Login);
router.post('/validate-token', authenticate, LoginController.validateToken);

module.exports = router;