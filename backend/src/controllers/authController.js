const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { logAudit } = require('../services/auditService');

const prisma = new PrismaClient();

// API 1: Register Tenant (Transaction)
const registerTenant = async (req, res, next) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

  try {
    // 1. Check Subdomain Uniqueness
    const existingTenant = await prisma.tenant.findUnique({ where: { subdomain } });
    if (existingTenant) {
      return res.status(409).json({ success: false, message: 'Subdomain already exists' });
    }

    // 2. Transaction: Create Tenant + User
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          subdomain,
          subscriptionPlan: 'free',
          maxUsers: 5,
          maxProjects: 3,
          status: 'active'
        }
      });

      const hashedPassword = await hashPassword(adminPassword);

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash: hashedPassword,
          fullName: adminFullName,
          role: 'tenant_admin'
        }
      });

      return { tenant, user };
    });

    // 3. Audit Log (System level event)
    await logAudit(result.tenant.id, result.user.id, 'REGISTER_TENANT', 'tenant', result.tenant.id, req.ip);

    // 4. Response
    res.status(201).json({
      success: true,
      message: "Tenant registered successfully",
      data: {
        tenantId: result.tenant.id,
        subdomain: result.tenant.subdomain,
        adminUser: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// API 2: User Login
const login = async (req, res, next) => {
  const { email, password, tenantSubdomain } = req.body;

  try {
    let tenantId = null;

    // 1. Validate Tenant (if subdomain provided)
    if (tenantSubdomain) {
      const tenant = await prisma.tenant.findUnique({ where: { subdomain: tenantSubdomain } });
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
      
      if (tenant.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Tenant account is suspended or inactive' });
      }
      tenantId = tenant.id;
    }

    // 2. Find User
    let user;
    if (tenantId) {
      // Standard User Login
      user = await prisma.user.findUnique({
        where: { tenantId_email: { tenantId, email } }
      });
    } else {
      // Super Admin Login (No tenant context)
      user = await prisma.user.findFirst({ where: { email, tenantId: null } });
    }

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'User account is inactive' });

    // 3. Check Password
    const match = await comparePassword(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // 4. Generate Token
    const token = generateToken(user);

    // 5. Audit Log (Login)
    await logAudit(user.tenantId || 'system', user.id, 'LOGIN', 'user', user.id, req.ip);

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
        expiresIn: 86400
      }
    });

  } catch (error) {
    next(error);
  }
};

// API 3: Get Current User
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

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { passwordHash, ...userData } = user;

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// API 4: Logout
const logout = async (req, res, next) => {
  try {
    // JWT is stateless, client handles token removal.
    // We just log the event.
    await logAudit(
      req.user.tenantId || 'system', 
      req.user.userId, 
      'LOGOUT', 
      'user', 
      req.user.userId, 
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerTenant, login, getMe, logout };