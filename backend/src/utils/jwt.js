const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId, 
      role: user.role
    },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '24h' }
  );
};

module.exports = { generateToken };