const jwt = require('jsonwebtoken');
const { hasSecureJwtSecret } = require('../config/security');

const verifyToken = (req, res, next) => {
  try {
    if (!hasSecureJwtSecret()) {
      return res.status(503).json({
        success: false,
        message: 'Authentication is not configured securely. Set a random JWT_SECRET of at least 32 characters.',
      });
    }

    // Check for token in HttpOnly cookie first, then Authorization header
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const mutatingMethod = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    if (mutatingMethod && req.cookies?.token) {
      const expectedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
      if (!req.get('origin') || req.get('origin') !== expectedOrigin) {
        return res.status(403).json({ success: false, message: 'Request origin is not allowed.' });
      }
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token.' });
  }
};

module.exports = { verifyToken };
