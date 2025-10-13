/**
 * Middleware to check if user is authenticated
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
}

/**
 * Middleware to check if user is authenticated and is an admin
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.session.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
}

/**
 * Middleware to attach user to request if authenticated
 */
function attachUser(req, res, next) {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.userName = req.session.userName;
    req.isAdmin = req.session.isAdmin || false;
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  attachUser
};
