const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { createProject, listProjects, updateProject, deleteProject } = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// Apply auth middleware to all routes
router.use(authenticate);

// API 12: Create Project
router.post('/', [
  check('name', 'Project name is required').not().isEmpty(),
  check('status', 'Invalid status').optional().isIn(['active', 'archived', 'completed'])
], validate, createProject);

// API 13: List Projects
router.get('/', listProjects);

// API 14: Update Project
router.put('/:projectId', updateProject);

// API 15: Delete Project
router.delete('/:projectId', deleteProject);

module.exports = router;