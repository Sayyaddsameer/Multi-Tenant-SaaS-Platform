const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../services/auditService');
const prisma = new PrismaClient();

// API 12: Create Project
// Access: Any Tenant Member
const createProject = async (req, res, next) => {
  const { name, description, status } = req.body;
  const { tenantId, userId, role } = req.user; // Added 'role'

  try {
    // 1. Check Subscription Limits (Max Projects)
    // SUPER ADMIN LOGIC: Bypass limit check
    if (role !== 'super_admin') {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const projectCount = await prisma.project.count({ where: { tenantId } });

        if (projectCount >= tenant.maxProjects) {
            res.status(403);
            throw new Error('Project limit reached. Upgrade your plan to add more.');
        }
    }

    // 2. Create Project
    const project = await prisma.project.create({
      data: {
        tenantId, // Note: If Super Admin creates, this might be null unless injected manually
        name,
        description,
        status: status || 'active',
        createdBy: userId
      }
    });

    await logAudit(tenantId, userId, 'CREATE_PROJECT', 'project', project.id, req.ip);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// API 13: List Projects
// Access: Any Tenant Member (Super Admin sees all)
const listProjects = async (req, res, next) => {
  const { tenantId, role } = req.user; // Added 'role'
  const { search, status, page = 1, limit = 10 } = req.query;

  try {
    // SUPER ADMIN LOGIC: If super_admin, remove tenant filter to see ALL projects
    const where = role === 'super_admin' ? {} : { tenantId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          creator: { select: { id: true, fullName: true } },
          _count: { select: { tasks: true } }
        }
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / take),
          totalProjects: total,
          limit: take
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// API 14: Update Project
// Access: Creator OR Tenant Admin OR Super Admin
const updateProject = async (req, res, next) => {
  const { projectId } = req.params;
  const { name, description, status } = req.body;
  const { tenantId, userId, role } = req.user;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Authorization: Must be same tenant AND (Creator OR Admin)
    // SUPER ADMIN LOGIC: Bypass these checks
    if (role !== 'super_admin') {
        if (project.tenantId !== tenantId) {
            res.status(403);
            throw new Error('Access denied');
        }

        if (project.createdBy !== userId && role !== 'tenant_admin') {
            res.status(403);
            throw new Error('Only the creator or admin can update this project');
        }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { name, description, status }
    });

    await logAudit(tenantId, userId, 'UPDATE_PROJECT', 'project', projectId, req.ip);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    next(error);
  }
};

// API 15: Delete Project
// Access: Creator OR Tenant Admin OR Super Admin
const deleteProject = async (req, res, next) => {
  const { projectId } = req.params;
  const { tenantId, userId, role } = req.user;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Authorization checks
    // SUPER ADMIN LOGIC: Bypass checks
    if (role !== 'super_admin') {
        if (project.tenantId !== tenantId) {
            res.status(403);
            throw new Error('Access denied');
        }

        if (project.createdBy !== userId && role !== 'tenant_admin') {
            res.status(403);
            throw new Error('Only the creator or admin can delete this project');
        }
    }

    await prisma.project.delete({ where: { id: projectId } });

    await logAudit(tenantId, userId, 'DELETE_PROJECT', 'project', projectId, req.ip);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createProject, listProjects, updateProject, deleteProject };