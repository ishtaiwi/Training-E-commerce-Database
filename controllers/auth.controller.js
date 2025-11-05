const authService = require('../services/auth.service');

exports.register = async (req, res, next) => {
  try {
    const { user, tokens } = await authService.register(req.body);
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens
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
    const { user, tokens } = await authService.login(email, password);
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens
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
    const { token } = req.body;
    const tokens = await authService.refreshToken(token);
    res.json(tokens);
  } catch (err) {
    if (err.message === 'Missing refresh token' || err.message === 'Invalid token') {
      return res.status(err.message === 'Missing refresh token' ? 400 : 401).json({ message: err.message });
    }
    next(err);
  }
};
