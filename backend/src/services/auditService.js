const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logAudit = async (tenantId, userId, action, entityType, entityId, ipAddress) => {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        ipAddress: ipAddress || 'unknown'
      }
    });
  } catch (error) {
    console.error('Audit Log Failed:', error);
    // We don't throw here to avoid blocking the main request flow
  }
};

module.exports = { logAudit };