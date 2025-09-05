import { Router } from 'express';
import passport from 'passport';
import {
  login,
  logout,
  signup,
  status,
  googleCallback,
  refresh
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get('/google/callback', googleCallback);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/status', status);
router.post('/refresh', refresh);

export default router;
