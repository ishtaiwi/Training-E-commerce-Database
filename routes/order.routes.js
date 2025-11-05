const router = require('express').Router();
const Joi = require('joi');
const { authenticateJWT, requireRoles } = require('../middlewares/auth.middleware');
const { createOrderFromCart, listMyOrders, updateOrderStatus } = require('../controllers/order.controller');

router.use(authenticateJWT);

router.post('/me', createOrderFromCart);
router.get('/me', listMyOrders);

router.patch('/:id/status', requireRoles('Admin', 'Editor'), (req, res, next) => {
  const schema = Joi.object({ status: Joi.string().valid('pending', 'paid', 'shipped', 'completed', 'cancelled').required() });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return updateOrderStatus(req, res, next);
});

module.exports = router;




