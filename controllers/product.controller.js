const productService = require('../services/product.service');

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.files);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    const result = await productService.listProducts(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProduct(req.params.id);
    res.json(product);
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.files);
    res.json(product);
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};
