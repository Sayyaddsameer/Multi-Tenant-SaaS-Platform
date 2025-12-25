const jwt = require('jsonwebtoken');

// 1. Authenticate Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded; // Attach user payload to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// 2. Role Authorization Middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    // req.user is set by the authenticate middleware above
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

// Export BOTH functions
module.exports = { authenticate, requireRole };