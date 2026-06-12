const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  driverLogin,
  adminLogin,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/driver/login', driverLogin);
router.post('/admin/login', adminLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/addresses', protect, addAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

module.exports = router;
