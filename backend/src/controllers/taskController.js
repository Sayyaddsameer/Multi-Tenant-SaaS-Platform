const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../services/auditService');
const prisma = new PrismaClient();

// API 16: Create Task
// Route: POST /api/projects/:projectId/tasks
const createTask = async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, priority, dueDate } = req.body;
  const { tenantId, userId, role } = req.user;

  try {
    // 1. Verify Project belongs to Tenant (Super Admins generally shouldn't create tasks in random tenants, but logic could be added)
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    
    // Strict check for regular users
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (role !== 'super_admin' && project.tenantId !== tenantId) {
       res.status(404); // Hide existence
       throw new Error('Project not found');
    }

    // Use the project's tenantId for the task, not the user's (important for Super Admin)
    const targetTenantId = project.tenantId;

    // 2. Verify Assigned User (if provided)
    if (assignedTo) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedTo } });
      if (!assignee || assignee.tenantId !== targetTenantId) {
        res.status(400);
        throw new Error('Assigned user does not belong to this organization');
      }
    }

    // 3. Create Task
    const task = await prisma.task.create({
      data: {
        tenantId: targetTenantId, // Ensure task belongs to project's tenant
        projectId,
        title,
        description,
        assignedTo,
        priority: priority || 'medium',
        status: 'todo',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    await logAudit(targetTenantId, userId, 'CREATE_TASK', 'task', task.id, req.ip);

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
  const { tenantId, role } = req.user;
  const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;

  try {
    // 1. Verify Project
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // --- LOGIC UPDATED: Allow Super Admin to bypass tenant check ---
    if (role !== 'super_admin') {
        if (project.tenantId !== tenantId) {
            res.status(404); // Hide existence
            throw new Error('Project not found');
        }
    }
    // -------------------------------------------------------------

    // 2. Build Query
    // We filter by projectId. 
    // We ALSO filter by tenantId unless it's a super admin (extra safety, though projectId check above covers it)
    const where = { projectId };
    if (role !== 'super_admin') {
        where.tenantId = tenantId;
    }

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
  const { tenantId, role } = req.user;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Allow Super Admin or Owner Tenant
    if (role !== 'super_admin' && task.tenantId !== tenantId) {
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
  const { tenantId, userId, role } = req.user;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Allow Super Admin or Owner Tenant
    if (role !== 'super_admin' && task.tenantId !== tenantId) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Verify Assignee if changing
    if (assignedTo) {
       const assignee = await prisma.user.findUnique({ where: { id: assignedTo } });
       // Ensure assignee belongs to the TASK'S tenant (not necessarily the logged in user's tenant if Super Admin)
       if (!assignee || assignee.tenantId !== task.tenantId) {
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

    await logAudit(task.tenantId, userId, 'UPDATE_TASK', 'task', taskId, req.ip);

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