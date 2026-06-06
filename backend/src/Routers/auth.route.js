const express = require('express');
const { refreshToken, userProfile } = require('../controllers/auth.controller');
const passport = require('passport');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173' }),
  (req, res) => {
    // Redirect to frontend after successful auth
    res.redirect('http://localhost:5173');
  }
);

router.post('/refresh-token', refreshToken);

router.get('/profile', userProfile);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;