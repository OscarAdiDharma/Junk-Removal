const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a user or driver token
    if (decoded.role === 'driver') {
      req.user = await Driver.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Driver tidak ditemukan.' });
      }
    } else {
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
      }
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token telah kadaluarsa.' });
    }
    next(error);
  }
};

/**
 * Restrict access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.userRole || req.user?.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role '${userRole}' tidak memiliki izin untuk mengakses resource ini.`,
      });
    }
    next();
  };
};

/**
 * Generate JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = { protect, authorize, generateToken };
