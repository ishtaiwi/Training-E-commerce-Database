const Order = require('../models/Order');

class ReportService {
  async getSalesSummary() {
    const [summary] = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: '$total' }, ordersCount: { $count: {} } } },
      { $project: { _id: 0 } }
    ]);
    return summary || { totalSales: 0, ordersCount: 0 };
  }

  async getTopProducts(limit = 5) {
    return await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id: 0, productId: '$product._id', name: '$product.name', totalSold: 1, revenue: 1 } }
    ]);
  }

  async getOrdersPerUser() {
    return await Order.aggregate([
      { $group: { _id: '$user', count: { $count: {} }, total: { $sum: '$total' } } },
      { $sort: { count: -1 } }
    ]);
  }
}

module.exports = new ReportService();
