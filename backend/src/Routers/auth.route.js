const express = require('express');
const { userProfile } = require('../controllers/auth.controller');
const { isLoggedIn } = require('../middleware/auth.middleware');
const passport = require('passport');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173' }),
  (req, res) => {
    // Session-based auth: passport has attached the user and session (connect.sid cookie).
    // Redirect to frontend root (no tokens in URL).
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    // ensure session saved before redirect so browser retains connect.sid for backend
    if (req.session) {
      req.session.save(() => res.redirect(frontend));
    } else {
      res.redirect(frontend);
    }
  }
);

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