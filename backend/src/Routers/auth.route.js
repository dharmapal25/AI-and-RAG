// backend/src/Routers/auth.route.js

const express = require('express');
const { userProfile } = require('../controllers/auth.controller');
const { isLoggedIn } = require('../middleware/auth.middleware');
const passport = require('passport');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}
));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` || 'http://localhost:5173' }, (err, user, info) => {
    if (err) {
      console.error('Google auth error:', err);
      // return JSON with error message for debugging; frontend redirect avoided during debug
      return res.status(500).json({ error: err.message || err });
    }

    if (!user) {
      console.warn('Google auth returned no user, info:', info);
      return res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Session login error after Google auth:', loginErr);
        return res.status(500).json({ error: loginErr.message || loginErr });
      }

      const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
      if (req.session) {
        req.session.save(() => res.redirect(frontend));
      } else {
        res.redirect(frontend);
      }
    });
  })(req, res, next);
});

// session-aware profile endpoint (protected) — ensure session is valid
router.get('/profile', isLoggedIn, userProfile);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    // destroy session and clear session cookie
    req.session?.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
});

module.exports = router;