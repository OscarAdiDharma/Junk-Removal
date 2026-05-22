const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getEstimate,
  createOrder,
  getMyOrders,
  getOrder,
  rateOrder,
  getAllOrders,
  updateOrderStatus,
  assignDriver,
  getAnalytics,
} = require('../controllers/order.controller');

// Public
router.post('/estimate', getEstimate);

// Customer
router.post('/', protect, authorize('customer'), createOrder);
router.get('/my-orders', protect, authorize('customer'), getMyOrders);
router.post('/:id/rate', protect, authorize('customer'), rateOrder);

// Shared (customer can see own, admin can see all)
router.get('/:id', protect, getOrder);

module.exports = router;
