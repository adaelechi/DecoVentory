const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public route
router.post('/login', authController.login);

// Protected routes
router.post('/change-passcode', authMiddleware, authController.changePasscode);
router.put('/update-role-passcode', authMiddleware, authController.adminUpdatePasscode);

module.exports = router;
