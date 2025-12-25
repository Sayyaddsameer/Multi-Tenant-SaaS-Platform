const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// API 5: Get Tenant Details
// Access: Tenant Admin (Own Tenant) OR Super Admin (Any Tenant)
const getTenant = async (req, res, next) => {
  const { tenantId } = req.params;

  try {
    // Authorization Check
    // If user is NOT Super Admin AND user's tenantId doesn't match requested ID
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      res.status(403);
      throw new Error('Access denied: You can only view your own tenant');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { users: true, projects: true, tasks: true } // Stats
        }
      }
    });

    if (!tenant) {
      res.status(404);
      throw new Error('Tenant not found');
    }

    // Flatten stats for cleaner response
    const stats = {
      totalUsers: tenant._count.users,
      totalProjects: tenant._count.projects,
      totalTasks: tenant._count.tasks
    };
    delete tenant._count;

    res.json({
      success: true,
      data: { ...tenant, stats }
    });
  } catch (error) {
    next(error);
  }
};

// API 6: Update Tenant
// Access: Tenant Admin (Name only) OR Super Admin (All fields)
const updateTenant = async (req, res, next) => {
  const { tenantId } = req.params;
  const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

  try {
    // 1. Authorization Check
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      res.status(403);
      throw new Error('Access denied');
    }

    // 2. Filter Allowed Fields based on Role
    let updateData = {};
    
    if (req.user.role === 'super_admin') {
      // Super Admin can update everything
      if (name) updateData.name = name;
      if (status) updateData.status = status;
      if (subscriptionPlan) updateData.subscriptionPlan = subscriptionPlan;
      if (maxUsers) updateData.maxUsers = parseInt(maxUsers);
      if (maxProjects) updateData.maxProjects = parseInt(maxProjects);
    } else {
      // Tenant Admin can ONLY update name
      if (status || subscriptionPlan || maxUsers || maxProjects) {
        res.status(403);
        throw new Error('Tenant Admins can only update organization name');
      }
      if (name) updateData.name = name;
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: updatedTenant
    });
  } catch (error) {
    next(error);
  }
};

// API 7: List All Tenants
// Access: Super Admin ONLY
const listTenants = async (req, res, next) => {
  const { page = 1, limit = 10, search } = req.query;

  try {
    // Super Admin check is handled by route middleware, but double check here is fine
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [tenants, total] = await prisma.$transaction([
      prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { users: true, projects: true } }
        }
      }),
      prisma.tenant.count({ where })
    ]);

    // Format response
    const formattedTenants = tenants.map(t => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      status: t.status,
      subscriptionPlan: t.subscriptionPlan,
      totalUsers: t._count.users,
      totalProjects: t._count.projects,
      createdAt: t.createdAt
    }));

    res.json({
      success: true,
      data: {
        tenants: formattedTenants,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / take),
          totalTenants: total,
          limit: take
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getTenant, updateTenant, listTenants };