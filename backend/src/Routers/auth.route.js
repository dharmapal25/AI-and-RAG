const express = require('express');
const passport = require('passport');
const { userProfile } = require('../controllers/auth.controller');
const { isLoggedIn } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login`
  }),
  (req, res) => {

    req.session.save((err) => {
      if (err) {
        console.log(err);
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
      }

      return res.redirect(process.env.FRONTEND_URL);
    });
  }
);

router.get('/profile', isLoggedIn, userProfile);

router.get('/logout', (req, res) => {
  req.logout(() => {

    req.session.destroy(() => {

      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      });

      res.json({
        success: true
      });

    });

  });
});

module.exports = router;