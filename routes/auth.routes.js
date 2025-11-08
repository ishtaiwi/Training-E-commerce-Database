const router = require('express').Router();
const Joi = require('joi');
const { register, login, refresh, logout } = require('../controllers/auth.controller');

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

router.post('/register', (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return register(req, res, next);
});

router.post('/login', (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return login(req, res, next);
});

router.post('/refresh', refresh);

router.post('/logout', logout);

module.exports = router;




