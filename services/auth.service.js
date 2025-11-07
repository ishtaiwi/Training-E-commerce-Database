const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  signTokens(user) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT secrets are not configured');
    }
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async register(userData) {
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
    const tokens = this.signTokens(user);
    return { user, tokens };
  }

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    const tokens = this.signTokens(user);
    return { user, tokens };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Missing refresh token');
      error.statusCode = 400;
      throw error;
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      const error = new Error('JWT refresh secret is not configured');
      error.statusCode = 500;
      throw error;
    }
    
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      // Handle different JWT error types
      if (err.name === 'TokenExpiredError') {
        const error = new Error('Refresh token has expired');
        error.statusCode = 401;
        throw error;
      } else if (err.name === 'JsonWebTokenError') {
        const error = new Error('Invalid refresh token');
        error.statusCode = 401;
        throw error;
      } else {
        const error = new Error('Token verification failed');
        error.statusCode = 401;
        throw error;
      }
    }
    
    if (!payload || !payload.sub) {
      const error = new Error('Invalid token payload');
      error.statusCode = 401;
      throw error;
    }
    
    const user = await User.findById(payload.sub);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }
    
    return this.signTokens(user);
  }
}

module.exports = new AuthService();
