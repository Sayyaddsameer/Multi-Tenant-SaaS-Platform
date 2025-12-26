const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { logAudit } = require('../services/auditService');

const prisma = new PrismaClient();

const registerTenant = async (req, res, next) => {
  // Added 'plan' to destructuring to avoid hardcoding 'free'
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName, plan } = req.body;
  try {
    const existing = await prisma.tenant.findUnique({ where: { subdomain } });
    if (existing) {
      res.status(409);
      throw new Error('Subdomain exists');
    }

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        // Use the plan from the request body, default to 'free' if not provided
        data: { name: tenantName, subdomain, subscriptionPlan: plan || 'free' }
      });
      const hashedPassword = await hashPassword(adminPassword);
      const user = await tx.user.create({
        data: { tenantId: tenant.id, email: adminEmail, passwordHash: hashedPassword, fullName: adminFullName, role: 'tenant_admin' }
      });
      return { tenant, user };
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  const { email, password, tenantSubdomain } = req.body;
  try {
    let user;
    let tenantId = null;

    // --- SUPER ADMIN LOGIC START ---
    if (email === 'superadmin@system.com') {
        user = await prisma.user.findFirst({
            where: {
                email: 'superadmin@system.com',
                role: 'super_admin',
                tenantId: null 
            }
        });
        
        if (!user) {
            res.status(401);
            throw new Error('Invalid credentials');
        }
    } 
    else {
        if (tenantSubdomain) {
            const tenant = await prisma.tenant.findUnique({ where: { subdomain: tenantSubdomain } });
            if (!tenant) { res.status(404); throw new Error('Tenant not found'); }
            tenantId = tenant.id;
        }

        if (tenantId) {
             user = await prisma.user.findFirst({ 
                 where: { email: email, tenantId: tenantId } 
             });
        } else {
             user = await prisma.user.findFirst({ where: { email, tenantId: null } });
        }
    }

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      res.status(401); throw new Error('Invalid credentials');
    }

    res.json({ 
        success: true, 
        token: generateToken({ ...user, tenantId: user.tenantId }), 
        data: { 
            token: generateToken({ ...user, tenantId: user.tenantId }),
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                fullName: user.fullName,
                tenantId: user.tenantId
            } 
        }
    });
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        res.json({ success: true, data: user });
    } catch(e) { next(e); }
};

const logout = async (req, res) => { res.json({ success: true }); };

module.exports = { registerTenant, login, getMe, logout };