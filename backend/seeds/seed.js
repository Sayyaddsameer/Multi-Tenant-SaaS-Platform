const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log(' Starting Database Seeding...');

  // 1. Create Super Admin (Tenant ID is NULL)
  // Check if exists to avoid duplicates
  const superAdminEmail = 'superadmin@system.com';
  const superAdminHash = await bcrypt.hash('Admin@123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { 
        // We can't use compound unique key here easily because tenantId is null
        // We'll rely on a manual check or findFirst for this specific case
        tenantId_email: { tenantId: "", email: "placeholder" } // This won't match, we rely on create below
    }, 
    // Hack: For seeding, it's easier to delete and recreate or check manually.
    // Let's use clean findFirst for SuperAdmin
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: superAdminHash,
      fullName: 'System Super Admin',
      role: 'super_admin',
      tenantId: null // Crucial: Super Admin has no tenant
    }
  }).catch(async (e) => {
    // If upsert fails due to unique constraint logic on nulls, try findFirst
    const exists = await prisma.user.findFirst({ where: { email: superAdminEmail }});
    if (!exists) {
        return prisma.user.create({
            data: {
              email: superAdminEmail,
              passwordHash: superAdminHash,
              fullName: 'System Super Admin',
              role: 'super_admin',
              tenantId: null
            }
        });
    }
  });

  console.log(' Super Admin Created');

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

  console.log(` Tenant Created: ${demoTenant.name}`);

  // 3. Create Tenant Admin
  const adminHash = await bcrypt.hash('Demo@123', 10);
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
  const user1 = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'user1@demo.com',
      passwordHash: userHash,
      fullName: 'Alice Employee',
      role: 'user'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'user2@demo.com',
      passwordHash: userHash,
      fullName: 'Bob Worker',
      role: 'user'
    }
  });

  console.log(' Users Created');

  // 5. Create Sample Projects
  const project1 = await prisma.project.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Website Redesign',
      description: 'Q4 Website Overhaul',
      status: 'active',
      createdBy: tenantAdmin.id
    }
  });

  const project2 = await prisma.project.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Mobile App Launch',
      description: 'iOS and Android release',
      status: 'active',
      createdBy: tenantAdmin.id
    }
  });

  console.log(' Projects Created');

  // 6. Create Tasks
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
      },
      {
        tenantId: demoTenant.id,
        projectId: project2.id,
        title: 'App Store Submission',
        status: 'todo',
        priority: 'medium',
        assignedTo: tenantAdmin.id
      }
    ]
  });

  console.log(' Tasks Created');
  console.log(' Seeding Completed Successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });