const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

// @desc    Register a new tenant and admin user
// @route   POST /api/auth/register-tenant
// @access  Public
const registerTenant = async (req, res, next) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

  try {
    // 1. Check if subdomain exists
    const existingTenant = await prisma.tenant.findUnique({ where: { subdomain } });
    if (existingTenant) {
      res.status(409);
      throw new Error('Subdomain already exists');
    }

    // 2. Transaction: Create Tenant + Admin User
    const result = await prisma.$transaction(async (tx) => {
      // Create Tenant with defaults
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          subdomain,
          subscriptionPlan: 'free',
          maxUsers: 5,
          maxProjects: 3
        },
      });

      // Hash Password
      const hashedPassword = await hashPassword(adminPassword);

      // Create Admin User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash: hashedPassword,
          fullName: adminFullName,
          role: 'tenant_admin',
        },
      });

      return { tenant, user };
    });

    // 3. Response (201 Created)
    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenantId: result.tenant.id,
        subdomain: result.tenant.subdomain,
        adminUser: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role
        }
      },
    });

  } catch (error) {
    // Check for unique constraint violation (Email per tenant)
    // Note: Since this is a new tenant, email collision usually implies global check logic if desired,
    // but schema enforces (tenantId, email). 
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password, tenantSubdomain } = req.body;

  try {
    let tenantId = null;

    // 1. Resolve Tenant ID from Subdomain
    if (tenantSubdomain) {
      const tenant = await prisma.tenant.findUnique({ where: { subdomain: tenantSubdomain } });
      if (!tenant) {
        res.status(404);
        throw new Error('Tenant not found');
      }
      if (tenant.status === 'suspended') {
        res.status(403);
        throw new Error('Tenant account is suspended');
      }
      tenantId = tenant.id;
    }

    // 2. Find User
    let user;
    if (tenantId) {
      user = await prisma.user.findUnique({
        where: { tenantId_email: { tenantId, email } }
      });
    } else {
      // Super Admin login (no tenant)
      user = await prisma.user.findFirst({ where: { email, tenantId: null } });
    }

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // 3. Verify Password
    if (!(await comparePassword(password, user.passwordHash))) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // 4. Generate Token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          tenantId: user.tenantId
        },
        token,
        expiresIn: 86400 // 24 hours
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { 
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            subscriptionPlan: true,
            maxUsers: true,
            maxProjects: true
          }
        } 
      }
    });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { passwordHash, ...userData } = user;

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  // JWT is stateless, so we just return success.
  // Client is responsible for deleting the token.
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = { registerTenant, login, getMe, logout };