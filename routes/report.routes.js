const router = require('express').Router();
const { authenticateJWT, requireRoles } = require('../middlewares/auth.middleware');
const { salesSummary, topProducts, ordersPerUser } = require('../controllers/report.controller');

router.use(authenticateJWT, requireRoles('Admin'));

router.get('/sales-summary', salesSummary);
router.get('/top-products', topProducts);
router.get('/orders-per-user', ordersPerUser);

module.exports = router;




