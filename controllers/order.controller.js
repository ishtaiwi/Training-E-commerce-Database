const orderService = require('../services/order.service');

exports.createOrderFromCart = async (req, res, next) => {
  try {
    const order = await orderService.createOrderFromCart(req.user.sub);
    res.status(201).json(order);
  } catch (err) {
    if (err.message === 'Cart is empty') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

exports.listMyOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersByUser(req.user.sub);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.json(order);
  } catch (err) {
    if (err.message === 'Order not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};
