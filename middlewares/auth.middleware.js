const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server configuration error' });
  }
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
}

function requireOwnershipOrRoles(getOwnerId, ...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (roles.includes(req.user.role)) return next();
    const resourceOwnerId = getOwnerId(req);
    if (resourceOwnerId && String(resourceOwnerId) === String(req.user.sub)) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
}

module.exports = { authenticateJWT, requireRoles, requireOwnershipOrRoles };




