const express = require('express');
const { check, validationResult } = require('express-validator');
const { createTask, listTasks, updateTaskStatus, updateTask } = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// Router A: Nested Routes (/api/projects/:projectId/tasks)
const projectTaskRouter = express.Router({ mergeParams: true });
projectTaskRouter.use(authenticate);

projectTaskRouter.post('/', [
  check('title', 'Title is required').not().isEmpty()
], validate, createTask);

projectTaskRouter.get('/', listTasks);


// Router B: Direct Routes (/api/tasks/:taskId)
const directTaskRouter = express.Router();
directTaskRouter.use(authenticate);

directTaskRouter.patch('/:taskId/status', [
  check('status', 'Status required').isIn(['todo', 'in_progress', 'completed'])
], validate, updateTaskStatus);

directTaskRouter.put('/:taskId', updateTask);

module.exports = { projectTaskRouter, directTaskRouter };