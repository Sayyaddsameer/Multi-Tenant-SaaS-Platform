const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { registerTenant, login, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Validator Helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation Error', errors: errors.array() });
  }
  next();
};

// API 1: Register Tenant
router.post('/register-tenant', [
  check('tenantName', 'Tenant Name is required').not().isEmpty(),
  check('subdomain', 'Subdomain is required').isAlphanumeric(),
  check('adminEmail', 'Valid email required').isEmail(),
  check('adminPassword', 'Password must be 8+ chars').isLength({ min: 8 }),
  check('adminFullName', 'Admin Name is required').not().isEmpty()
], validate, registerTenant);

// API 2: Login
router.post('/login', [
  check('email', 'Valid email required').isEmail(),
  check('password', 'Password is required').exists()
], validate, login);

// API 3: Get Me
router.get('/me', authenticate, getMe);

// API 4: Logout
router.post('/logout', authenticate, logout);

module.exports = router;