import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import { getDb } from '../database.js';
import {
  usersTableName,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
} from '../constants/common.js';

const db = getDb();

const access_token_encode = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
const refresh_token_encode = new TextEncoder().encode(REFRESH_TOKEN_SECRET);
const access_expiry = '15m';
const refresh_expiry = '7d';

const accessBlacklist = new Set();
const refreshBlacklist = new Set();

function isStrongPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 12) return false;
  const upper = /[A-Z]/.test(pw);
  const lower = /[a-z]/.test(pw);
  const digit = /\d/.test(pw);
  const special = /[^A-Za-z0-9]/.test(pw);
  return upper && lower && digit && special;
}

async function createAccessToken(user) {
  return new SignJWT({ sub: String(user.id), username: user.username, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(access_expiry)
    .sign(access_token_encode);
}

async function createRefreshToken(user) {
  const jti = randomUUID();
  const token = await new SignJWT({ sub: String(user.id), jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(refresh_expiry)
    .sign(refresh_token_encode);
  return { token, jti };
}

async function verifyAccess(token) {
  if (accessBlacklist.has(token)) return null;
  try {
    const { payload } = await jwtVerify(token, access_token_encode);
    return payload;
  } catch {
    return null;
  }
}

async function verifyRefresh(token) {
  if (refreshBlacklist.has(token)) return null;
  try {
    const { payload } = await jwtVerify(token, refresh_token_encode);
    return payload;
  } catch {
    return null;
  }
}

passport.use(
  new LocalStrategy(
    { usernameField: 'identifier', passwordField: 'password' },
    async (identifier, password, done) => {
      try {
        const query = `
          SELECT id, username, email, password_hash, full_name
          FROM ${usersTableName}
          WHERE username = $1 OR email = $1
          LIMIT 1
        `;
        const { rows } = await db.query(query, [identifier]);
        if (rows.length === 0) {
          return done(null, false, { message: 'Invalid username/email or password.' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid username/email or password.' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      passReqToCallback: false
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const fullName = profile.displayName;
        const googleId = profile.id;
        const findQ = `SELECT id, username, email, full_name FROM ${usersTableName} WHERE email = $1 LIMIT 1`;
        const findRes = await db.query(findQ, [email]);
        let user;
        if (findRes.rows.length > 0) {
          user = findRes.rows[0];
        } else {
          const username = email.split('@')[0];
          const insertQ = `
            INSERT INTO ${usersTableName} (username, email, full_name, google_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, full_name
          `;
          const ins = await db.query(insertQ, [username, email, fullName, googleId]);
          user = ins.rows[0];
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

const login = (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    try {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ success: false, message: info.message });
      }
      const access = await createAccessToken(user);
      const { token: refresh } = await createRefreshToken(user);
      res.json({
        success: true,
        message: 'Login successful.',
        access_token: access,
        refresh_token: refresh,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name
        }
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Login failed.', error: { message: error.message } });
    }
  })(req, res, next);
};

const signup = async (req, res) => {
  try {
    const { username, password, email, full_name } = req.body;
    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ success: false, message: 'Username, email, and password are required.' });
    }
    if (!isStrongPassword(password)) {
      return res.status(422).json({
        success: false,
        message:
          'Password must be at least 12 characters and include upper, lower, number, and special character.'
      });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const insertQuery = `
      INSERT INTO ${usersTableName} (username, email, password_hash, full_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, full_name
    `;
    const { rows } = await db.query(insertQuery, [username, email, hashedPassword, full_name]);
    const newUser = rows[0];
    const access = await createAccessToken(newUser);
    const { token: refresh } = await createRefreshToken(newUser);
    res.status(201).json({
      success: true,
      message: 'Signup successful.',
      access_token: access,
      refresh_token: refresh,
      data: newUser
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Username or email already exists.' });
    }
    res
      .status(500)
      .json({ success: false, message: 'Failed to sign up.', error: { message: error.message } });
  }
};

const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    try {
      if (err) {
        return res.status(500).json({ success: false, message: 'Google authentication failed.' });
      }
      if (!user) {
        return res.status(401).json({ success: false, message: 'Google login failed.' });
      }
      const access = await createAccessToken(user);
      const { token: refresh } = await createRefreshToken(user);
      res.json({
        success: true,
        message: 'Google login successful.',
        access_token: access,
        refresh_token: refresh,
        data: user
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Token generation failed.' });
    }
  })(req, res, next);
};

const logout = async (req, res) => {
  let loggedOut = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = await verifyAccess(token);
    if (payload) {
      accessBlacklist.add(token);
      loggedOut = true;
    }
  }
  const refreshHeader = req.headers['x-refresh-token'];
  if (refreshHeader) {
    const payload = await verifyRefresh(refreshHeader);
    if (payload) {
      refreshBlacklist.add(refreshHeader);
      loggedOut = true;
    }
  }
  if (!loggedOut) {
    return res
      .status(401)
      .json({ success: false, message: 'No active session or valid token found.' });
  }
  res.json({ success: true, message: 'Logout successful.' });
};

const status = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'User is not authenticated.' });
  }
  const payload = await verifyAccess(token);
  if (payload) {
    return res.json({
      success: true,
      message: 'User is authenticated via token.',
      data: { id: payload.sub, username: payload.username, email: payload.email }
    });
  }
  res.status(401).json({ success: false, message: 'User is not authenticated.' });
};

const refresh = async (req, res) => {
  try {
    const refreshToken =
      req.headers['x-refresh-token'] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing.' });
    }
    const payload = await verifyRefresh(refreshToken);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
    refreshBlacklist.add(refreshToken);
    const q = `
      SELECT id, username, email, full_name
      FROM ${usersTableName}
      WHERE id = $1
      LIMIT 1
    `;
    const { rows } = await db.query(q, [payload.sub]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    const user = rows[0];
    const access = await createAccessToken(user);
    const { token: newRefresh } = await createRefreshToken(user);
    res.json({
      success: true,
      message: 'Token refreshed.',
      access_token: access,
      refresh_token: newRefresh
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to refresh token.' });
  }
};

export { login, signup, googleCallback, logout, status, refresh };
