const express = require('express');
const router = express.Router();
const { registerTenant, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register-tenant', registerTenant);
router.post('/login', login);

// Protected Routes
router.get('/me', authenticate, getMe);

// Logout (Just a dummy success response for JWT)
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;