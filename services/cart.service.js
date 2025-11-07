const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartService {
  async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
  }

  async addItem(userId, productId, quantity) {
    // Validate that product exists
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if product is in stock
    if (product.stock < quantity) {
      const error = new Error('Insufficient stock');
      error.statusCode = 400;
      throw error;
    }

    // First, ensure cart exists
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId.toString()
    );

    if (existingItemIndex >= 0) {
      // Item exists, increment quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      // Check stock availability for the new total quantity
      if (product.stock < newQuantity) {
        const error = new Error('Insufficient stock');
        error.statusCode = 400;
        throw error;
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Item doesn't exist, add new item
      cart.items.push({ product: productId, quantity });
    }

    cart.updatedAt = new Date();
    await cart.save();
    return await Cart.findById(cart._id).populate('items.product');
  }

  async removeItem(userId, productId) {
    return await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { product: productId } }, $set: { updatedAt: new Date() } },
      { new: true }
    );
  }

  async clearCart(userId) {
    return await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [], updatedAt: new Date() } },
      { new: true, upsert: true }
    );
  }
}

module.exports = new CartService();
