const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateToken } = require('../middleware/auth');

/**
 * @desc    Register new customer
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    const user = await User.create({ name, email, phone, password });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unified login (customer, driver, admin — auto detect)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Cek di koleksi User (customer & admin)
    const user = await User.findOne({ email }).select('+password');
    if (user) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Email atau password salah' });
      if (!user.isActive) return res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan' });

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const token = generateToken(user._id, user.role);
      return res.json({
        success: true,
        message: 'Login berhasil',
        data: { user, token, role: user.role },
      });
    }

    // 2. Cek di koleksi Driver
    const driver = await Driver.findOne({ email }).select('+password');
    if (driver) {
      const isMatch = await driver.comparePassword(password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Email atau password salah' });
      if (!driver.isActive) return res.status(403).json({ success: false, message: 'Akun driver telah dinonaktifkan' });

      const token = generateToken(driver._id, 'driver');
      return res.json({
        success: true,
        message: 'Login driver berhasil',
        data: { user: driver, token, role: 'driver' },
      });
    }

    // 3. Tidak ditemukan
    return res.status(401).json({ success: false, message: 'Email atau password salah' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login driver
 * @route   POST /api/auth/driver/login
 * @access  Public
 */
const driverLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ email }).select('+password');
    if (!driver) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    const isMatch = await driver.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    if (!driver.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Akun driver telah dinonaktifkan',
      });
    }

    const token = generateToken(driver._id, 'driver');

    res.json({
      success: true,
      message: 'Login driver berhasil',
      data: { user: driver, token, role: 'driver' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login admin
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial admin tidak valid',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial admin tidak valid',
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login admin berhasil',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

/**
 * @desc    Update profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add address
 * @route   POST /api/auth/addresses
 * @access  Private
 */
const addAddress = async (req, res, next) => {
  try {
    const { label, address, city, postalCode, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push({ label, address, city, postalCode, isDefault: isDefault || false });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Alamat berhasil ditambahkan',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete address
 * @route   DELETE /api/auth/addresses/:addressId
 * @access  Private
 */
const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.addressId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Alamat berhasil dihapus',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, driverLogin, adminLogin, getMe, updateProfile, addAddress, deleteAddress };
