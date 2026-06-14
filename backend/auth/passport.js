const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('../src/models/users.model');

passport.use( new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },

    async (accessToken, refreshToken, profile, done) => {

      try {

        const user = await User.findOneAndUpdate(
          {
            googleId: profile.id
          },
          {
            $set: {
              googleId: profile.id,
              displayName: profile.displayName,
              email: profile.emails[0].value,
              profilePicture: profile.photos?.[0]?.value || ''
            }
          },
          {
            upsert: true,
            new: true
          }
        );

        done(null, user);

      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {

  try {

    const user = await User.findById(id);

    done(null, user);

  } catch (error) {

    done(error);

  }
});

module.exports = passport;