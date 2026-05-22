const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAllOrders, updateOrderStatus, assignDriver, getAnalytics } = require('../controllers/order.controller');
const { getAllDrivers, createDriver, updateDriver, deleteDriver, getAvailableDrivers } = require('../controllers/driver.controller');
const { getAllUsers, toggleUserStatus } = require('../controllers/user.controller');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// Analytics
router.get('/analytics', getAnalytics);

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:id/assign', assignDriver);

// Drivers
router.get('/drivers', getAllDrivers);
router.get('/drivers/available', getAvailableDrivers);
router.post('/drivers', createDriver);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteDriver);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);

module.exports = router;
