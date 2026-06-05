const express = require('express');
const { refreshToken, userProfile } = require('../controllers/auth.controller');
const passport = require('passport');

const router = express.Router();

// refresh token route
router.post('/refresh-token', refreshToken);

router.get('/profile', userProfile);

// google callback 
router.get("/google/callback",
    passport.authenticate('google', {
        failureRedirect: '/',
        failureMessage: true
    }),
    (req, res) => {
        console.log('✅ Successfully logged in!');
        res.redirect('/profile');
    })

// Google login route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

module.exports = router;