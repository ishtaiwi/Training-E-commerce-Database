const router = require('express').Router();
const Joi = require('joi');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { getMyCart, addToCart, removeFromCart, clearCart } = require('../controllers/cart.controller');

router.use(authenticateJWT);

router.get('/me', getMyCart);

router.post('/me/items', (req, res, next) => {
  const schema = Joi.object({ productId: Joi.string().required(), quantity: Joi.number().integer().min(1).required() });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return addToCart(req, res, next);
});

router.delete('/me/items', (req, res, next) => {
  const schema = Joi.object({ productId: Joi.string().required() });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return removeFromCart(req, res, next);
});

router.delete('/me', clearCart);

module.exports = router;




