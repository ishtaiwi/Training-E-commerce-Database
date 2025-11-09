const orderService = require('../services/order.service');
const auditService = require('../services/audit.service');

function buildAuditContext(req) {
  return {
    actor: req.user ? {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role
    } : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
}

exports.createOrderFromCart = async (req, res, next) => {
  try {
    const order = await orderService.createOrderFromCart(req.user.sub);

    await auditService.record('order.created', {
      ...buildAuditContext(req),
      target: {
        type: 'Order',
        id: order.id
      },
      metadata: {
        total: order.total,
        itemsCount: order.items ? order.items.length : 0
      }
    });

    res.status(201).json(order);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
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
    const existingOrder = await orderService.getOrderById(req.params.id);
    const order = await orderService.updateOrderStatus(req.params.id, status);

    await auditService.record('order.status.updated', {
      ...buildAuditContext(req),
      target: {
        type: 'Order',
        id: order.id
      },
      metadata: {
        previousStatus: existingOrder.status,
        newStatus: order.status
      }
    });

    res.json(order);
  } catch (err) {
    if (err.message === 'Order not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};
