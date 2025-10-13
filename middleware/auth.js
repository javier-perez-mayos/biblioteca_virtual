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
 * Middleware to attach user to request if authenticated
 */
function attachUser(req, res, next) {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.userName = req.session.userName;
  }
  next();
}

module.exports = {
  requireAuth,
  attachUser
};
