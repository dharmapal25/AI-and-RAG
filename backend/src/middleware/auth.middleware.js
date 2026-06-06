// Middleware to protect routes using server session (connect.sid)
// This prefers Passport's `req.isAuthenticated()` but also accepts
// the presence of a loaded session object (req.session.passport.user).
exports.isLoggedIn = (req, res, next) => {
  try {
    // Passport helper
    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
      return next();
    }

    // Fallback: session object loaded and contains passport user id
    if (req.session && req.session.passport && req.session.passport.user) {
      // attach user id to req.user for downstream handlers
      req.user = req.user || {};
      req.user._id = req.session.passport.user;
      return next();
    }

    // No session or not authenticated
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (err) {
    console.error('Auth middleware error', err);
    return res.status(500).json({ message: 'Auth error' });
  }
};
