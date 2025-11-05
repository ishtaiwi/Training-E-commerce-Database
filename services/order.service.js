const Order = require('../models/Order');
const Cart = require('../models/Cart');
const productService = require('./product.service');

class OrderService {
  async createOrderFromCart(userId) {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const items = cart.items.map(ci => ({
      product: ci.product._id,
      quantity: ci.quantity,
      priceAtPurchase: ci.product.price
    }));
    const total = items.reduce((sum, it) => sum + it.quantity * it.priceAtPurchase, 0);

    for (const ci of cart.items) {
      await productService.decrementStock(ci.product._id, ci.quantity);
    }

    const order = await Order.create({
      user: userId,
      items,
      total,
      status: 'pending'
    });

    await Cart.updateOne({ user: userId }, { $set: { items: [] } });
    return order;
  }

  async getOrdersByUser(userId) {
    return await Order.find({ user: userId }).populate('items.product');
  }

  async updateOrderStatus(orderId, status) {
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true, runValidators: true });
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }
}

module.exports = new OrderService();
