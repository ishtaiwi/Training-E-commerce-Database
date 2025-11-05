const router = require('express').Router();
const { authenticateJWT, requireRoles } = require('../middlewares/auth.middleware');
const { listUsers, getMe, updateUserRole } = require('../controllers/user.controller');
const Joi = require('joi');

router.use(authenticateJWT);

router.get('/me', getMe);

router.get('/', requireRoles('Admin'), listUsers);

router.patch('/:id/role', requireRoles('Admin'), (req, res, next) => {
  const schema = Joi.object({ role: Joi.string().valid('Admin', 'Editor', 'Viewer').required() });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return updateUserRole(req, res, next);
});

module.exports = router;




