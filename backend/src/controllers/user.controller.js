const User = require('../models/User');

/**
 * @desc    Get all users (admin)
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'customer' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user active status (admin)
 * @route   PATCH /api/admin/users/:id/toggle
 * @access  Private (admin)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, toggleUserStatus };
