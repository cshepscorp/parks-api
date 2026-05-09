import passport from 'passport';
import dotenv from 'dotenv';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import prisma from '../db.js';
import requireAuth from '../middleware/auth.js';

dotenv.config();

const router = Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';

// configure passport with google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // find existing user or create a new one
    const user = await prisma.user.upsert({
      where: { googleId: profile.id },
      update: { name: profile.displayName, email: profile.emails[0].value },
      create: {
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value
      }
    });
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// redirect to google login
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

// google redirects here after login
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failed' }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });

    res.redirect(CLIENT_URL);
  }
);

router.get('/me', requireAuth, (req, res) => {
    res.json(req.user);
})

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect(process.env.CLIENT_URL);
})

router.get('/failed', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

export default router;