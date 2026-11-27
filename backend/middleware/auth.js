const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session token.' });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const userRole = req.user.role;

    // Super admin inherits full access wherever admin privileges are accepted
    if (userRole === 'super_admin' && (allowedRoles.includes('admin') || allowedRoles.includes('super_admin'))) {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  authorizeRoles
};
