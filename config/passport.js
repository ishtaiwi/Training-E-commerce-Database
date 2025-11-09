const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const authService = require('../services/auth.service');

module.exports = function configurePassport(passport) {
  const missing = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
  if (!process.env.GOOGLE_CALLBACK_URL) missing.push('GOOGLE_CALLBACK_URL');
  if (missing.length) {
    throw new Error(`Missing Google OAuth environment variables: ${missing.join(', ')}`);
  }

  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await authService.findOrCreateGoogleUser(profile);
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
};

