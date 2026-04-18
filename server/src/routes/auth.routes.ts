import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { signJWT, findOrCreateUser } from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';
import { UserModel } from '../models/user.model';
import type { Env } from '../config/env';
import type { AuthRequest } from '../middleware/auth.middleware';

export function authRouter(env: Env): Router {
  const router = Router();

  passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${env.SERVER_URL}/api/auth/google/callback`,
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser({
        googleId: profile.id,
        email: profile.emails?.[0]?.value ?? '',
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  }));

  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }));

  router.get('/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${env.CLIENT_URL}/login?error=auth_failed`,
    }),
    (req, res) => {
      const user = req.user as { id: string };
      const token = signJWT(user.id, env.JWT_SECRET);
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.redirect(`${env.CLIENT_URL}/dashboard`);
    },
  );

  router.post('/logout', requireAuth, (_req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  router.get('/me', requireAuth, async (req, res) => {
    const { userId } = req as AuthRequest;
    const user = await UserModel.findById(userId).lean();
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  });

  return router;
}
