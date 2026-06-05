const express = require('express');
const { refreshToken, userProfile, loginWithGoogle } = require('../controllers/auth.controller');

const router = express.Router();

// refresh token route
router.post('/refresh-token', refreshToken);

router.get('/profile', userProfile);

// google login route
router.get("/google", loginWithGoogle);

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

module.exports = router;