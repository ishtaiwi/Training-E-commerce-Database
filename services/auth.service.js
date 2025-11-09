const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES_IN;
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS, 10);

function requireJwtSecrets() {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (!ACCESS_TOKEN_TTL) missing.push('JWT_ACCESS_EXPIRES_IN');
  if (!Number.isInteger(REFRESH_TOKEN_TTL_DAYS)) missing.push('JWT_REFRESH_EXPIRES_IN_DAYS');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function calculateRefreshExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

class AuthService {
  constructor() {
    requireJwtSecrets();
  }

  buildPayload(user) {
    return { sub: user._id, email: user.email, role: user.role };
  }

  generateAccessToken(user) {
    const payload = this.buildPayload(user);
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  }

  async generateRefreshToken(user, context = {}) {
    const payload = this.buildPayload(user);
    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` });
    const tokenHash = hashToken(token);
    const expiresAt = calculateRefreshExpiry();

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
      createdByIp: context.ip,
      userAgent: context.userAgent
    });

    return token;
  }

  async issueTokens(user, context) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user, context);
    return { accessToken, refreshToken };
  }

  async register(userData, context) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      throw new Error('Email already registered');
    }
    const passwordHash = await User.hashPassword(userData.password);
    const user = await User.create({
      name: userData.name,
      email: userData.email,
      passwordHash,
      role: userData.role
    });
    const tokens = await this.issueTokens(user, context);
    return { user, tokens };
  }

  async login(email, password, context) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    const tokens = await this.issueTokens(user, context);
    return { user, tokens };
  }

  async refreshToken(refreshToken, context = {}) {
    if (!refreshToken) {
      const error = new Error('Missing refresh token');
      error.statusCode = 400;
      throw error;
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      const error = new Error(err.name === 'TokenExpiredError' ? 'Refresh token has expired' : 'Invalid refresh token');
      error.statusCode = 401;
      throw error;
    }

    if (!payload || !payload.sub) {
      const error = new Error('Invalid token payload');
      error.statusCode = 401;
      throw error;
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    if (!storedToken) {
      const error = new Error('Refresh token not recognized');
      error.statusCode = 401;
      throw error;
    }

    if (storedToken.revokedAt) {
      const error = new Error('Refresh token already rotated');
      error.statusCode = 401;
      throw error;
    }

    if (storedToken.isExpired()) {
      const error = new Error('Refresh token has expired');
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    const tokens = await this.issueTokens(user, context);
    storedToken.revokedAt = new Date();
    storedToken.revokedByIp = context.ip;
    storedToken.replacedByTokenHash = hashToken(tokens.refreshToken);
    await storedToken.save();

    return tokens;
  }

  async revokeRefreshToken(refreshToken, context = {}) {
    if (!refreshToken) {
      return;
    }
    const tokenHash = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });
    if (!storedToken) {
      return;
    }
    storedToken.revokedAt = new Date();
    storedToken.revokedByIp = context.ip;
    await storedToken.save();
  }

  async findOrCreateGoogleUser(profile) {
    const googleId = profile.id;
    const primaryEmail = Array.isArray(profile.emails) && profile.emails.length > 0
      ? profile.emails[0].value
      : null;

    let user = await User.findOne({ provider: 'google', providerId: googleId });
    if (!user && primaryEmail) {
      user = await User.findOne({ email: primaryEmail });
    }

    if (user) {
      let requiresSave = false;
      if (user.provider !== 'google') {
        user.provider = 'google';
        requiresSave = true;
      }
      if (!user.providerId) {
        user.providerId = googleId;
        requiresSave = true;
      }
      if (requiresSave) {
        await user.save();
      }
      return user;
    }

    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await User.hashPassword(randomPassword);
    const displayName = profile.displayName || primaryEmail || `google_user_${googleId}`;

    return User.create({
      name: displayName,
      email: primaryEmail,
      passwordHash,
      role: 'Viewer',
      provider: 'google',
      providerId: googleId
    });
  }

  async loginWithGoogle(profile, context = {}) {
    const user = await this.findOrCreateGoogleUser(profile);
    const tokens = await this.issueTokens(user, context);
    return { user, tokens };
  }
}

module.exports = new AuthService();
