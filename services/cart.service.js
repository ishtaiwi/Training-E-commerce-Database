const Cart = require('../models/Cart');

class CartService {
  async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
  }

  async addItem(userId, productId, quantity) {
    const cart = await Cart.findOneAndUpdate(
      { user: userId, 'items.product': { $ne: productId } },
      { $push: { items: { product: productId, quantity } }, $set: { updatedAt: new Date() } },
      { new: true }
    );
    if (cart) return cart;
    return await Cart.findOneAndUpdate(
      { user: userId, 'items.product': productId },
      { $inc: { 'items.$.quantity': quantity }, $set: { updatedAt: new Date() } },
      { new: true, upsert: true }
    );
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
