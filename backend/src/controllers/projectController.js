const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../services/auditService');
const prisma = new PrismaClient();

// API 12: Create Project
// Access: Any Tenant Member
const createProject = async (req, res, next) => {
  // Added 'targetTenantId' to destructuring for Super Admin use
  const { name, description, status, targetTenantId } = req.body;
  const { tenantId, userId, role } = req.user; 

  try {
    // --- LOGIC ADDED START ---
    // Determine the actual tenant ID for the project.
    // If Super Admin, they must provide targetTenantId. 
    // If regular user, use their token's tenantId.
    const finalTenantId = role === 'super_admin' ? targetTenantId : tenantId;

    if (!finalTenantId) {
        res.status(400);
        throw new Error(role === 'super_admin' 
            ? 'Super Admins must provide a "targetTenantId" to create a project.' 
            : 'Tenant ID missing from token.');
    }
    // --- LOGIC ADDED END ---

    // 1. Check Subscription Limits (Max Projects)
    // SUPER ADMIN LOGIC: Bypass limit check
    if (role !== 'super_admin') {
        const tenant = await prisma.tenant.findUnique({ where: { id: finalTenantId } });
        const projectCount = await prisma.project.count({ where: { tenantId: finalTenantId } });

        if (projectCount >= tenant.maxProjects) {
            res.status(403);
            throw new Error('Project limit reached. Upgrade your plan to add more.');
        }
    }

    // 2. Create Project
    const project = await prisma.project.create({
      data: {
        tenantId: finalTenantId, // Uses the resolved ID (never null)
        name,
        description,
        status: status || 'active',
        createdBy: userId
      }
    });

    await logAudit(finalTenantId, userId, 'CREATE_PROJECT', 'project', project.id, req.ip);

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
  const { tenantId, role } = req.user; 
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
          _count: { select: { tasks: true } },
          tenant: { select: { name: true, subdomain: true } } // Added tenant info for list view
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

// --- NEW FUNCTION ADDED: Get Project By ID ---
const getProjectById = async (req, res, next) => {
  const { id } = req.params; // Note: Ensure route uses :id or :projectId
  const projectId = id || req.params.projectId; // Handle both naming conventions
  const { tenantId, role } = req.user;

  try {
    // SUPER ADMIN LOGIC:
    // If Super Admin, we search by ID only.
    // If Tenant Member, we MUST enforce tenantId check to prevent data leaks.
    const whereClause = role === 'super_admin' 
      ? { id: projectId } 
      : { id: projectId, tenantId: tenantId };

    const project = await prisma.project.findFirst({
      where: whereClause,
      include: {
        tasks: true,
        tenant: { select: { name: true, subdomain: true } }, // Useful for Super Admin context
        creator: { select: { id: true, fullName: true } }
      }
    });

    if (!project) {
      res.status(404);
      throw new Error('Project not found or access denied');
    }

    res.json({ success: true, data: project });
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

module.exports = { 
  createProject, 
  listProjects, 
  getProjectById, // Exporting the new function
  updateProject, 
  deleteProject 
};