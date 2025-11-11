const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const passport = require('passport');
const {
  register,
  login,
  refresh,
  logout,
  googleCallback,
  googleFailure,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/auth.controller');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Admin', 'Editor', 'Viewer').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const emailOnlySchema = Joi.object({
  email: Joi.string().email().required()
});

const tokenSchema = Joi.object({
  token: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required()
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

const resetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false
});

const resetConfirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return register(req, res, next);
});

router.post('/login', loginLimiter, (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return login(req, res, next);
});

router.post('/refresh', refresh);

router.post('/logout', logout);

router.post('/verify-email', (req, res, next) => {
  const { error } = tokenSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return verifyEmail(req, res, next);
});

router.post('/resend-verification', (req, res, next) => {
  const { error } = emailOnlySchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return resendVerification(req, res, next);
});

router.post('/request-password-reset', resetRequestLimiter, (req, res, next) => {
  const { error } = emailOnlySchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return requestPasswordReset(req, res, next);
});

router.post('/reset-password', resetConfirmLimiter, (req, res, next) => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return resetPassword(req, res, next);
});

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return googleFailure(req, res);
    req.user = user;
    return googleCallback(req, res, next);
  })(req, res, next);
});

router.get('/google/failure', googleFailure);

module.exports = router;




