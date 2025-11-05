const reportService = require('../services/report.service');

exports.salesSummary = async (req, res, next) => {
  try {
    const summary = await reportService.getSalesSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

exports.topProducts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 5);
    const items = await reportService.getTopProducts(limit);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.ordersPerUser = async (req, res, next) => {
  try {
    const items = await reportService.getOrdersPerUser();
    res.json(items);
  } catch (err) {
    next(err);
  }
};
