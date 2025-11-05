const router = require('express').Router();
const Joi = require('joi');
const { authenticateJWT, requireRoles } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');
const { createProduct, listProducts, getProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');

router.get('/', listProducts);
router.get('/:id', getProduct);

router.post('/', authenticateJWT, requireRoles('Admin', 'Editor'), upload.array('images', 5), (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    description: Joi.string().allow(''),
    price: Joi.number().min(0).required(),
    stock: Joi.number().integer().min(0).required()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return createProduct(req, res, next);
});

router.patch('/:id', authenticateJWT, requireRoles('Admin', 'Editor'), upload.array('images', 5), (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).optional(),
    description: Joi.string().allow('').optional(),
    price: Joi.number().min(0).optional(),
    stock: Joi.number().integer().min(0).optional()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  return updateProduct(req, res, next);
});

router.delete('/:id', authenticateJWT, requireRoles('Admin'), deleteProduct);

module.exports = router;




