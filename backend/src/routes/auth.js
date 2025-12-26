const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { registerTenant, login, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Validation Middleware Helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// API 1: Register Tenant
router.post('/register-tenant', [
  check('tenantName', 'Tenant Name is required').not().isEmpty(),
  check('subdomain', 'Subdomain is required and must be alphanumeric').isAlphanumeric(),
  check('adminEmail', 'Please include a valid email').isEmail(),
  check('adminPassword', 'Password must be 8 or more characters').isLength({ min: 8 }),
  check('adminFullName', 'Admin Name is required').not().isEmpty()
], validate, registerTenant);

// API 2: Login
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], validate, login);

// API 3: Get Me
router.get('/me', authenticate, getMe);

// API 4: Logout
router.post('/logout', authenticate, logout);

module.exports = router;