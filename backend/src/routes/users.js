const express = require('express');
const router = express.Router({ mergeParams: true }); // Important for nested params
const { check, validationResult } = require('express-validator');
const { addUser, listUsers, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// Routes requiring :tenantId (API 8 & 9)
// Note: These will be mounted at /api/tenants/:tenantId/users
router.post('/', [
  authenticate,
  check('email', 'Valid email required').isEmail(),
  check('password', 'Password 8+ chars').isLength({ min: 8 }),
  check('fullName', 'Name required').not().isEmpty()
], validate, addUser);

router.get('/', authenticate, listUsers);


// Routes using :userId directly (API 10 & 11)
// Note: We'll export a separate router or handle this in index.js
// For simplicity, let's create a separate router object for direct user routes
const directRouter = express.Router();

directRouter.put('/:userId', authenticate, updateUser);
directRouter.delete('/:userId', authenticate, deleteUser);

module.exports = { tenantUserRouter: router, userDirectRouter: directRouter };