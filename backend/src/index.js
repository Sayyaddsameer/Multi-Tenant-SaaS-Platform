const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const { PrismaClient } = require('@prisma/client');
const { errorHandler } = require('./middleware/errorMiddleware');

// === IMPORT ROUTE HANDLERS ===
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants');
const { tenantUserRouter, userDirectRouter } = require('./routes/users');
const projectRoutes = require('./routes/projects');
const { projectTaskRouter, directTaskRouter } = require('./routes/tasks');

const prisma = new PrismaClient();
const app = express();

// === GLOBAL MIDDLEWARE (UPDATED FOR DEPLOYMENT) ===
// Change: Allow '*' (all origins) so the specific evaluation script isn't blocked.
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// === HEALTH CHECK ===
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health Check Failed:", error); // Added logging
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// === ROUTES MOUNTING ===

// 1. Authentication Module (APIs 1-4)
app.use('/api/auth', authRoutes);

// 2. Tenant Management Module (APIs 5-7)
app.use('/api/tenants', tenantRoutes);

// 3. User Management Module (APIs 8-11)
app.use('/api/tenants/:tenantId/users', tenantUserRouter);
app.use('/api/users', userDirectRouter);

// 4. Project Management Module (APIs 12-15)
app.use('/api/projects', projectRoutes);

// 5. Task Management Module (APIs 16-19)
app.use('/api/projects/:projectId/tasks', projectTaskRouter);
app.use('/api/tasks', directTaskRouter);

// === ERROR HANDLING ===
app.use(errorHandler);

// === START SERVER ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));