const cartService = require('../services/cart.service');

exports.getMyCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.sub);
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addItem(req.user.sub, productId, quantity);
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const cart = await cartService.removeItem(req.user.sub, productId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.sub);
    res.json(cart);
  } catch (err) {
    next(err);
  }
};
