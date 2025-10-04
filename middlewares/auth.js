import { jwtVerify } from 'jose';
import { ACCESS_TOKEN_SECRET } from '../constants/common.js';
import { blockedTokens } from '../constants/auth.js';

const secret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const blockedToken = blockedTokens.get(payload.email)?.access;
    if (blockedToken?.includes(token)) {
      return res.status(401).json({ success: false, message: 'User token expired' });
    }
    req.user = payload;
    req.user.id = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token validation failed!' });
  }
}
