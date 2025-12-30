const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('[INFO] Starting Database Seeding...');

  // 1. Create Super Admin (Tenant ID is NULL)
  const superAdminEmail = 'superadmin@system.com';
  const superAdminHash = await bcrypt.hash('Admin@123', 10);
  
  let superAdmin = await prisma.user.findFirst({
    where: { email: superAdminEmail, tenantId: null }
  });

  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: superAdminHash,
        fullName: 'System Super Admin',
        role: 'super_admin',
        tenantId: null // Super admin must have null tenantId
      }
    });
    console.log('[SUCCESS] Super Admin Created');
  } else {
    console.log('[SKIP] Super Admin already exists');
  }

  // 2. Create Demo Tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      subdomain: 'demo',
      status: 'active',
      subscriptionPlan: 'pro',
      maxUsers: 25,
      maxProjects: 15
    }
  });
  console.log(`[SUCCESS] Tenant Created: ${demoTenant.name}`);

  // 3. Create Tenant Admin
  const adminHash = await bcrypt.hash('Demo@123', 10); // Matches required submission credentials
  const tenantAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'admin@demo.com'
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'admin@demo.com',
      passwordHash: adminHash,
      fullName: 'Demo Administrator',
      role: 'tenant_admin'
    }
  });

  // 4. Create Regular Users
  const userHash = await bcrypt.hash('User@123', 10);
  
  const user1 = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'user1@demo.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'user1@demo.com',
      passwordHash: userHash,
      fullName: 'Alice Employee',
      role: 'user'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'user2@demo.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'user2@demo.com',
      passwordHash: userHash,
      fullName: 'Bob Worker',
      role: 'user'
    }
  });
  console.log('[SUCCESS] Users Created');

  // 5. Create Sample Projects
  let project1 = await prisma.project.findFirst({
    where: { name: 'Website Redesign', tenantId: demoTenant.id }
  });

  if (!project1) {
    project1 = await prisma.project.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Website Redesign',
        description: 'Overhaul of the corporate website',
        status: 'active',
        createdBy: tenantAdmin.id
      }
    });
  }
  console.log('[SUCCESS] Projects Created');

  // 6. Create Tasks
  const taskCount = await prisma.task.count({ where: { projectId: project1.id } });
  if (taskCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          tenantId: demoTenant.id,
          projectId: project1.id,
          title: 'Design Mockups',
          status: 'completed',
          priority: 'high',
          assignedTo: user1.id
        },
        {
          tenantId: demoTenant.id,
          projectId: project1.id,
          title: 'Frontend Implementation',
          status: 'in_progress',
          priority: 'high',
          assignedTo: user2.id
        }
      ]
    });
    console.log('[SUCCESS] Tasks Created');
  }

  console.log('[DONE] Seeding Completed Successfully.');
}

main()
  .catch((e) => {
    console.error('[ERROR] Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
