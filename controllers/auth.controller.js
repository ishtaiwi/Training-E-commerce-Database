const authService = require('../services/auth.service');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TTL_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS, 10);

if (!Number.isInteger(REFRESH_TTL_DAYS)) {
  throw new Error('JWT_REFRESH_EXPIRES_IN_DAYS environment variable must be defined with an integer value');
}

const REFRESH_COOKIE_MAX_AGE = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

function buildContext(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
}

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/api/v1/auth/refresh'
  });
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh'
  });
}

exports.register = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const { user, verification } = await authService.register(req.body, context);
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
      verification,
      message: 'Account created. Please verify your email before logging in.'
    });
  } catch (err) {
    if (err.message === 'Email already registered') {
      return res.status(409).json({ message: err.message });
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const context = buildContext(req);
    const { user, tokens } = await authService.login(email, password, context);
    setRefreshTokenCookie(res, tokens.refreshToken);
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
      accessToken: tokens.accessToken
    });
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ message: err.message });
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    const context = buildContext(req);
    const tokens = await authService.refreshToken(refreshToken, context);
    setRefreshTokenCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    const context = buildContext(req);
    await authService.revokeRefreshToken(refreshToken, context);
    clearRefreshTokenCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Google authentication failed' });
    }
    const context = buildContext(req);
    const tokens = await authService.issueTokens(req.user, context);
    setRefreshTokenCookie(res, tokens.refreshToken);
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        emailVerified: req.user.emailVerified
      },
      accessToken: tokens.accessToken
    });
  } catch (err) {
    next(err);
  }
};

exports.googleFailure = (req, res) => {
  res.status(401).json({ message: 'Google authentication failed' });
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const context = buildContext(req);
    const result = await authService.requestPasswordReset(email, context);
    res.json({
      message: 'If that email exists, you will receive a password reset link shortly.',
      emailSent: result.emailSent,
      ...(result.token ? { token: result.token, resetUrl: result.resetUrl } : {})
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const context = buildContext(req);
    await authService.resetPassword(token, password, context);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const context = buildContext(req);
    const user = await authService.verifyEmailToken(token, context);
    res.json({
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const context = buildContext(req);
    const result = await authService.resendVerificationEmail(email, context);
    res.json({
      message: 'If that email exists, a verification link has been sent.',
      emailSent: result.emailSent,
      ...(result.token ? { token: result.token, verifyUrl: result.verifyUrl } : {})
    });
  } catch (err) {
    next(err);
  }
};
