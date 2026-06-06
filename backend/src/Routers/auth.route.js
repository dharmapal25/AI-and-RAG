const express = require('express');
const { refreshToken, userProfile } = require('../controllers/auth.controller');
const passport = require('passport');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

const jwt = require('jsonwebtoken');

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173' }),
  (req, res) => {
    // Create access + refresh tokens and send to frontend via URL fragment (dev-friendly)
    try {
      const user = req.user;
      const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
      res.cookie('refreshToken', refreshToken, { httpOnly: true });
      const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
      // use hash fragment so token isn't sent to the backend or in Referer
      res.redirect(`${frontend}/#accessToken=${accessToken}`);
    } catch (err) {
      console.error('Callback token error', err);
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    }
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