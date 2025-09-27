import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { randomUUID, randomBytes, createHash } from 'crypto';
import { getDb } from '../database.js';
import {
  usersTableName,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
} from '../constants/common.js';
import got from 'got';

const db = getDb();

const codeVerifiers = new Map();
const CODE_VERIFIER_TTL = 5 * 60 * 1000; // 5 minutes
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
  return new SignJWT({ sub: String(user.sub), username: user.email, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(access_expiry)
    .sign(access_token_encode);
}

async function createRefreshToken(user) {
  const jti = randomUUID();
  const token = await new SignJWT({ sub: String(user.sub), jti })
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
    // const { token: newRefresh } = await createRefreshToken(user);
    res.json({
      success: true,
      message: 'Token refreshed.',
      data: {
        accessToken: access
        // refreshToken: newRefresh
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to refresh token.' });
  }
};

const googleUrl = async (req, res) => {
  try {
    const state = randomBytes(16).toString('hex');
    const codeVerifier = randomBytes(32).toString('hex');

    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

    // Save verifier + timestamp
    codeVerifiers.set(state, { codeVerifier, createdAt: Date.now() });

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', GOOGLE_CALLBACK_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);

    res.json({ success: true, message: 'url fetched', data: { url: url.toString() } });
  } catch (error) {
    res.json({ success: false, message: 'Couldnt fetch URL' });
  }
};

const googleCallback = async (req, res) => {
  const { code, state } = req.query;
  const record = codeVerifiers.get(state);

  // Validate existence + expiry
  if (!record || Date.now() - record.createdAt > CODE_VERIFIER_TTL) {
    codeVerifiers.delete(state); // cleanup stale record
    return res.status(400).json({ error: 'Invalid or expired state' });
  }

  // Remove verifier after use
  codeVerifiers.delete(state);

  try {
    const tokenRes = await got.post('https://oauth2.googleapis.com/token', {
      form: {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        code_verifier: record.codeVerifier,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      },
      responseType: 'json'
    });

    const profile = decodeJwt(tokenRes.body?.id_token);

    const accessToken = await createAccessToken(profile);
    const { token: refreshToken } = await createRefreshToken(profile);
    const { email, name, picture, sub: googleId } = profile;
    const findQ = `SELECT id, username, email, name, picture FROM ${usersTableName} WHERE email = $1 LIMIT 1`;
    const findRes = await db.query(findQ, [email]);
    let user;
    if (findRes.rows.length > 0) {
      user = findRes.rows[0];
    } else {
      const username = email.split('@')[0];
      const insertQ = `
            INSERT INTO ${usersTableName} (username, email, name, "googleId", picture)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, email, name, picture
          `;
      const ins = await db.query(insertQ, [username, email, name, googleId, picture]);
      user = ins.rows[0];
    }

    res.json({
      success: true,
      data: { accessToken, refreshToken, profile: user },
      message: 'Authentication successfull'
    });
  } catch (err) {
    console.error('Token exchange failed:', err.response?.body || err.message);
    res.status(500).json({ success: false, message: 'Authentication failed.' });
  }
};

export { login, signup, googleCallback, logout, status, refresh, googleUrl };
