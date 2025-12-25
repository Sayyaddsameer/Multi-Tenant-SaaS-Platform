const express = require('express');
const router = express.Router();
const { getTenant, updateTenant, listTenants } = require('../controllers/tenantController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// Note: authenticate middleware adds req.user

// API 7: List Tenants (Super Admin Only)
router.get('/', authenticate, requireRole('super_admin'), listTenants);

// API 5: Get Specific Tenant
router.get('/:tenantId', authenticate, getTenant);

// API 6: Update Tenant
router.put('/:tenantId', authenticate, updateTenant);

module.exports = router;