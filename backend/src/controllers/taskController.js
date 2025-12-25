const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../services/auditService');
const prisma = new PrismaClient();

// API 16: Create Task
// Route: POST /api/projects/:projectId/tasks
const createTask = async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, priority, dueDate } = req.body;
  const { tenantId, userId } = req.user;

  try {
    // 1. Verify Project belongs to Tenant
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.tenantId !== tenantId) {
      res.status(404);
      throw new Error('Project not found');
    }

    // 2. Verify Assigned User (if provided)
    if (assignedTo) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedTo } });
      if (!assignee || assignee.tenantId !== tenantId) {
        res.status(400);
        throw new Error('Assigned user does not belong to this organization');
      }
    }

    // 3. Create Task
    const task = await prisma.task.create({
      data: {
        tenantId,
        projectId,
        title,
        description,
        assignedTo,
        priority: priority || 'medium',
        status: 'todo',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    await logAudit(tenantId, userId, 'CREATE_TASK', 'task', task.id, req.ip);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// API 17: List Project Tasks
// Route: GET /api/projects/:projectId/tasks
const listTasks = async (req, res, next) => {
  const { projectId } = req.params;
  const { tenantId } = req.user;
  const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;

  try {
    // 1. Verify Project
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.tenantId !== tenantId) {
      res.status(404);
      throw new Error('Project not found');
    }

    // 2. Build Query
    const where = { projectId, tenantId };

    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (priority) where.priority = priority;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 3. Execute
    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: [
          { priority: 'desc' }, // High priority first
          { dueDate: 'asc' }    // Then soonest due date
        ],
        include: {
          assignee: {
            select: { id: true, fullName: true, email: true }
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        total,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / take),
          limit: take
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// API 18: Update Task Status (Quick Patch)
// Route: PATCH /api/tasks/:taskId/status
const updateTaskStatus = async (req, res, next) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const { tenantId } = req.user;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    
    if (!task || task.tenantId !== tenantId) {
      res.status(404);
      throw new Error('Task not found');
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      select: { id: true, status: true, updatedAt: true }
    });

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

// API 19: Full Task Update
// Route: PUT /api/tasks/:taskId
const updateTask = async (req, res, next) => {
  const { taskId } = req.params;
  const { title, description, status, priority, assignedTo, dueDate } = req.body;
  const { tenantId, userId } = req.user;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.tenantId !== tenantId) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Verify Assignee if changing
    if (assignedTo) {
       const assignee = await prisma.user.findUnique({ where: { id: assignedTo } });
       if (!assignee || assignee.tenantId !== tenantId) {
         res.status(400);
         throw new Error('Assigned user not in tenant');
       }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title, 
        description, 
        status, 
        priority, 
        assignedTo, 
        dueDate: dueDate ? new Date(dueDate) : undefined
      },
      include: { assignee: { select: { id: true, fullName: true, email: true } } }
    });

    await logAudit(tenantId, userId, 'UPDATE_TASK', 'task', taskId, req.ip);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, listTasks, updateTaskStatus, updateTask };