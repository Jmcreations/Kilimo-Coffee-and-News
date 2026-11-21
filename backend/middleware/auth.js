const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kilimo_coffee_fallback_secret_2026';

// Verify Bearer JWT on protected routes
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session token.' });
  }
}

// Restrict endpoint to one or more roles ('admin', 'journalist', 'delivery')
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }
    next();
  };
}

module.exports = { verifyToken, authorizeRoles, JWT_SECRET };
