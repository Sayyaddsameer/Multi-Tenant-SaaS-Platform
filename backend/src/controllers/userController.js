const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/hash');
const { logAudit } = require('../services/auditService');

const prisma = new PrismaClient();

// API 8: Add User to Tenant
// Access: Tenant Admin Only
const addUser = async (req, res, next) => {
  const { tenantId } = req.params;
  const { email, password, fullName, role } = req.body;

  try {
    // 1. Authorization: Only admin of THIS tenant
    if (req.user.role !== 'tenant_admin' || req.user.tenantId !== tenantId) {
      res.status(403);
      throw new Error('Access denied: Unauthorized');
    }

    // 2. Check Subscription Limit
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const userCount = await prisma.user.count({ where: { tenantId } });

    if (userCount >= tenant.maxUsers) {
      res.status(403);
      throw new Error('Subscription limit reached. Upgrade plan to add more users.');
    }

    // 3. Check Email Uniqueness (in this tenant)
    const existingUser = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } }
    });

    if (existingUser) {
      res.status(409);
      throw new Error('User with this email already exists in your organization');
    }

    // 4. Create User
    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash: hashedPassword,
        fullName,
        role: role || 'user', // Default to 'user'
      }
    });

    // 5. Audit Log
    await logAudit(tenantId, req.user.userId, 'CREATE_USER', 'user', newUser.id, req.ip);

    // Remove password hash from response
    const { passwordHash, ...userData } = newUser;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// API 9: List Tenant Users
// Access: Any member of the tenant
const listUsers = async (req, res, next) => {
  const { tenantId } = req.params;
  const { search, role, page = 1, limit = 50 } = req.query;

  try {
    // 1. Isolation Check
    if (req.user.tenantId !== tenantId && req.user.role !== 'super_admin') {
      res.status(403);
      throw new Error('Access denied');
    }

    // 2. Build Query
    const where = { tenantId };
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) {
      where.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 3. Execute
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: { // Select specific fields to exclude passwordHash
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
            createdAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
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

// API 10: Update User
const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  const { fullName, role, isActive } = req.body;

  try {
    // 1. Find User to check ownership
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      res.status(404);
      throw new Error('User not found');
    }

    // 2. Authorization Logic
    const isSelf = req.user.userId === userId;
    const isTenantAdmin = req.user.role === 'tenant_admin' && req.user.tenantId === targetUser.tenantId;

    if (!isSelf && !isTenantAdmin) {
      res.status(403);
      throw new Error('Access denied');
    }

    // 3. Prepare Update Data (Restrict fields)
    const updateData = {};
    if (fullName) updateData.fullName = fullName;

    // Only Admin can change role/active status
    if (isTenantAdmin) {
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
    } else if (role || isActive) {
      res.status(403);
      throw new Error('Only admins can change role or active status');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, fullName: true, role: true, isActive: true, updatedAt: true }
    });

    await logAudit(targetUser.tenantId, req.user.userId, 'UPDATE_USER', 'user', userId, req.ip);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// API 11: Delete User
const deleteUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      res.status(404);
      throw new Error('User not found');
    }

    // Auth Check
    if (req.user.role !== 'tenant_admin' || req.user.tenantId !== targetUser.tenantId) {
      res.status(403);
      throw new Error('Access denied');
    }

    // Prevent Self-Delete
    if (req.user.userId === userId) {
      res.status(403);
      throw new Error('Cannot delete yourself');
    }

    await prisma.user.delete({ where: { id: userId } });

    await logAudit(targetUser.tenantId, req.user.userId, 'DELETE_USER', 'user', userId, req.ip);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { addUser, listUsers, updateUser, deleteUser };