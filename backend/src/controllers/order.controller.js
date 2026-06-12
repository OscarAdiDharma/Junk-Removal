const Order = require('../models/Order');

// Pricing configuration
const PRICING_CONFIG = {
  basePackageKg: 10,            // Paket standard: 10 kg pertama
  basePackagePrice: 200000,     // Harga flat paket standard
  excessPricePerKg: 15000,      // Rp 15.000 per kg kelebihan
  platformFee: 0.20,            // Margin keuntungan 20%
  // Default weight (kg) per kategori
  defaultWeights: {
    sofa: 45,
    kasur: 25,
    lemari: 60,
    elektronik: 15,
    meja: 20,
    kursi: 8,
    kulkas: 55,
    mesin_cuci: 50,
    lainnya: 20,
  },
};

// Hitung harga dasar berdasarkan total berat pesanan
const calcOrderBasePrice = (totalWeightKg) => {
  if (totalWeightKg <= PRICING_CONFIG.basePackageKg) {
    return PRICING_CONFIG.basePackagePrice; // flat 200k untuk ≤10kg
  }
  const excessKg = totalWeightKg - PRICING_CONFIG.basePackageKg;
  return PRICING_CONFIG.basePackagePrice + excessKg * PRICING_CONFIG.excessPricePerKg;
};

/**
 * @desc    Calculate price estimate
 * @route   POST /api/orders/estimate
 * @access  Public
 */
const getEstimate = async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Items tidak boleh kosong' });
  }

  // Hitung total berat semua item
  let totalWeightKg = 0;
  const detailedItems = items.map((item) => {
    const weightKg = item.weightKg || PRICING_CONFIG.defaultWeights[item.category] || 20;
    const qty = item.quantity || 1;
    totalWeightKg += weightKg * qty;
    return { ...item, weightKg, quantity: qty };
  });

  // Kalkulasi paket bertingkat
  const excessKg = Math.max(0, totalWeightKg - PRICING_CONFIG.basePackageKg);
  const baseAmount = calcOrderBasePrice(totalWeightKg);
  const platformFee = Math.round(baseAmount * PRICING_CONFIG.platformFee);
  const total = baseAmount + platformFee;

  res.json({
    success: true,
    data: {
      totalWeightKg,
      basePackageKg: PRICING_CONFIG.basePackageKg,
      basePackagePrice: PRICING_CONFIG.basePackagePrice,
      excessKg,
      excessPrice: excessKg * PRICING_CONFIG.excessPricePerKg,
      excessPricePerKg: PRICING_CONFIG.excessPricePerKg,
      platformFee,
      platformFeeRate: PRICING_CONFIG.platformFee,
      total,
      items: detailedItems,
    },
  });
};

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private (customer)
 */
const createOrder = async (req, res, next) => {
  try {
    const { items, pickupAddress, scheduledDate, scheduledTime, paymentMethod, notes } = req.body;

    // Hitung total berat semua item pesanan
    let totalWeightKg = 0;
    const pricedItems = items.map((item) => {
      const weightKg = item.weightKg || PRICING_CONFIG.defaultWeights[item.category] || 20;
      const qty = item.quantity || 1;
      totalWeightKg += weightKg * qty;
      return {
        ...item,
        weightKg,
        estimatedPrice: 0, // harga dihitung di level pesanan
        photoAnalysis: item.photoAnalysis || null,
      };
    });

    // Kalkulasi paket bertingkat berdasarkan total berat
    const excessKg = Math.max(0, totalWeightKg - PRICING_CONFIG.basePackageKg);
    const baseAmount = calcOrderBasePrice(totalWeightKg);
    const platformFee = Math.round(baseAmount * PRICING_CONFIG.platformFee);
    const pricing = {
      basePrice: PRICING_CONFIG.basePackagePrice,
      itemsTotal: excessKg * PRICING_CONFIG.excessPricePerKg,
      platformFee,
      distanceFee: 0,
      discount: 0,
      tax: 0,
      total: baseAmount + platformFee,
    };

    const order = await Order.create({
      customer: req.user._id,
      items: pricedItems,
      pickupAddress,
      scheduledDate,
      scheduledTime,
      pricing,
      payment: { method: paymentMethod || 'cash' },
      notes,
      statusHistory: [{ status: 'pending', note: 'Pesanan dibuat', updatedBy: 'customer' }],
    });

    await order.populate('customer', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer orders
 * @route   GET /api/orders/my-orders
 * @access  Private (customer)
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { customer: req.user._id };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('driver', 'name phone vehicle rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('driver', 'name phone vehicle currentLocation rating');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    // Customer can only see their own orders
    if (req.userRole === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rate an order
 * @route   POST /api/orders/:id/rate
 * @access  Private (customer)
 */
const rateOrder = async (req, res, next) => {
  try {
    const { score, comment } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Hanya pesanan selesai yang bisa dinilai' });
    }

    order.rating = { score, comment, ratedAt: new Date() };
    await order.save();

    // Update driver rating
    if (order.driver) {
      const Driver = require('../models/Driver');
      const driver = await Driver.findById(order.driver);
      if (driver) {
        const newCount = driver.rating.count + 1;
        const newAvg = (driver.rating.average * driver.rating.count + score) / newCount;
        driver.rating = { average: Math.round(newAvg * 10) / 10, count: newCount };
        await driver.save();
      }
    }

    res.json({ success: true, message: 'Penilaian berhasil disimpan' });
  } catch (error) {
    next(error);
  }
};

// ======================== ADMIN CONTROLLERS ========================

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/admin/orders
 * @access  Private (admin)
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20, dateFrom, dateTo } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('driver', 'name phone vehicle')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        orders,
        pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (admin)
 * @route   PATCH /api/admin/orders/:id/status
 * @access  Private (admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });

    order.status = status;
    order.statusHistory.push({ status, note: note || '', updatedBy: 'admin' });

    if (status === 'completed') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      if (order.driver) {
        const Driver = require('../models/Driver');
        await Driver.findByIdAndUpdate(order.driver, {
          $inc: { totalTrips: 1 },
          status: 'available',
        });
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('driver', 'name phone vehicle');

    res.json({ success: true, message: 'Status pesanan diperbarui', data: { order: updatedOrder } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign driver to order (admin)
 * @route   PATCH /api/admin/orders/:id/assign
 * @access  Private (admin)
 */
const assignDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;
    const Driver = require('../models/Driver');

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver tidak ditemukan' });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        driver: driverId,
        status: 'assigned',
        $push: {
          statusHistory: { status: 'assigned', note: `Driver ${driver.name} ditugaskan`, updatedBy: 'admin' },
        },
      },
      { new: true }
    )
      .populate('customer', 'name email phone')
      .populate('driver', 'name phone vehicle');

    // Update driver status
    await Driver.findByIdAndUpdate(driverId, { status: 'on_duty' });

    res.json({ success: true, message: 'Driver berhasil ditugaskan', data: { order } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get analytics data (admin)
 * @route   GET /api/admin/analytics
 * @access  Private (admin)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const Driver = require('../models/Driver');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total stats
    const [
      totalOrders,
      completedOrders,
      pendingOrders,
      totalUsers,
      totalDrivers,
      monthlyRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'assigned'] } }),
      User.countDocuments({ role: 'customer' }),
      Driver.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Revenue trend (last 7 days)
    const revenueTrend = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top categories
    const topCategories = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.category', count: { $sum: '$items.quantity' }, revenue: { $sum: '$items.estimatedPrice' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const currentMonthRevenue = monthlyRevenue[0]?.total || 0;
    const prevMonthRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = prevMonthRevenue
      ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          completedOrders,
          pendingOrders,
          totalUsers,
          totalDrivers,
          monthlyRevenue: currentMonthRevenue,
          revenueGrowth,
        },
        ordersByStatus,
        revenueTrend,
        topCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update actual weight after driver weighing (admin)
 * @route   PATCH /api/admin/orders/:id/actual-weight
 * @access  Private (admin)
 */
const updateActualWeight = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ itemIndex, actualWeightKg }]

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Data berat tidak valid' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });

    // Update weight pada masing-masing item
    items.forEach(({ itemIndex, actualWeightKg }) => {
      if (order.items[itemIndex] !== undefined) {
        const kg = Math.max(1, parseFloat(actualWeightKg) || 1);
        order.items[itemIndex].weightKg = kg;
        order.items[itemIndex].estimatedPrice = 0; // harga tidak lagi per-item
      }
    });

    // Hitung ulang total berat
    let totalWeightKg = 0;
    order.items.forEach((item) => {
      totalWeightKg += (item.weightKg || 20) * (item.quantity || 1);
    });

    // Hitung ulang harga paket
    const excessKg = Math.max(0, totalWeightKg - PRICING_CONFIG.basePackageKg);
    const baseAmount = calcOrderBasePrice(totalWeightKg);
    const platformFee = Math.round(baseAmount * PRICING_CONFIG.platformFee);

    order.pricing.basePrice = PRICING_CONFIG.basePackagePrice;
    order.pricing.itemsTotal = excessKg * PRICING_CONFIG.excessPricePerKg;
    order.pricing.platformFee = platformFee;
    order.pricing.total = baseAmount + platformFee + (order.pricing.distanceFee || 0) - (order.pricing.discount || 0);

    order.statusHistory.push({
      status: order.status,
      note: 'Berat aktual diperbarui oleh admin setelah penimbangan',
      updatedBy: 'admin',
    });

    await order.save();

    const updated = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('driver', 'name phone vehicle');

    res.json({
      success: true,
      message: 'Berat aktual dan harga berhasil diperbarui',
      data: { order: updated },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEstimate,
  createOrder,
  getMyOrders,
  getOrder,
  rateOrder,
  getAllOrders,
  updateOrderStatus,
  assignDriver,
  getAnalytics,
  updateActualWeight,
};
