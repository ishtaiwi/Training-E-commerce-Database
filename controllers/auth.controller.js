const authService = require('../services/auth.service');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || '7', 10) * 24 * 60 * 60 * 1000;

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
    const { user, tokens } = await authService.register(req.body, context);
    setRefreshTokenCookie(res, tokens.refreshToken);
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken: tokens.accessToken
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken: tokens.accessToken
    });
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ message: err.message });
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
