const Driver = require('../models/Driver');
const Order = require('../models/Order');

/**
 * @desc    Get all drivers (admin)
 * @route   GET /api/admin/drivers
 * @access  Private (admin)
 */
const getAllDrivers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Driver.countDocuments(filter);
    const drivers = await Driver.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { drivers, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create driver (admin)
 * @route   POST /api/admin/drivers
 * @access  Private (admin)
 */
const createDriver = async (req, res, next) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json({ success: true, message: 'Driver berhasil ditambahkan', data: { driver } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update driver (admin)
 * @route   PUT /api/admin/drivers/:id
 * @access  Private (admin)
 */
const updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver tidak ditemukan' });
    res.json({ success: true, message: 'Data driver diperbarui', data: { driver } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete driver (admin)
 * @route   DELETE /api/admin/drivers/:id
 * @access  Private (admin)
 */
const deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!driver) return res.status(404).json({ success: false, message: 'Driver tidak ditemukan' });
    res.json({ success: true, message: 'Driver berhasil dinonaktifkan' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update driver location (driver self)
 * @route   PATCH /api/drivers/location
 * @access  Private (driver)
 */
const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    await Driver.findByIdAndUpdate(req.user._id, {
      currentLocation: { lat, lng, updatedAt: new Date() },
    });
    res.json({ success: true, message: 'Lokasi diperbarui' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update driver status
 * @route   PATCH /api/drivers/status
 * @access  Private (driver)
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const driver = await Driver.findByIdAndUpdate(req.user._id, { status }, { new: true });
    res.json({ success: true, data: { driver } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available drivers (admin)
 * @route   GET /api/admin/drivers/available
 * @access  Private (admin)
 */
const getAvailableDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find({ status: 'available', isActive: true })
      .select('name phone vehicle currentLocation rating');
    res.json({ success: true, data: { drivers } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDrivers, createDriver, updateDriver, deleteDriver, updateLocation, updateStatus, getAvailableDrivers };
