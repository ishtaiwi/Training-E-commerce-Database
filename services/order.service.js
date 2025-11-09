const Order = require('../models/Order');
const Cart = require('../models/Cart');
const productService = require('./product.service');

class OrderService {
  async getOrderById(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async createOrderFromCart(userId) {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !cart.items || cart.items.length === 0) {
      const error = new Error('Cart is empty');
      error.statusCode = 400;
      throw error;
    }

    // Validate that all products exist and are populated
    for (const ci of cart.items) {
      if (!ci.product) {
        const error = new Error(`Product not found in cart item`);
        error.statusCode = 404;
        throw error;
      }
      if (!ci.product._id || ci.product.price === undefined) {
        const error = new Error(`Invalid product data in cart`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Prepare order items
    const items = cart.items.map(ci => ({
      product: ci.product._id,
      quantity: ci.quantity,
      priceAtPurchase: ci.product.price
    }));
    const total = items.reduce((sum, it) => sum + it.quantity * it.priceAtPurchase, 0);

    // Validate stock availability before processing
    for (const ci of cart.items) {
      if (ci.product.stock < ci.quantity) {
        const error = new Error(`Insufficient stock for product: ${ci.product.name}`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Decrement stock for all items (this also validates stock again to prevent race conditions)
    for (const ci of cart.items) {
      try {
        await productService.decrementStock(ci.product._id, ci.quantity);
      } catch (err) {
        // If stock decrement fails (e.g., race condition), throw a clear error
        const error = new Error(err.message || `Failed to process stock for product: ${ci.product.name}`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Create order
    const order = await Order.create({
      user: userId,
      items,
      total,
      status: 'pending'
    });

    // Clear cart
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });
    
    // Return populated order
    return await Order.findById(order._id).populate('items.product');
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
