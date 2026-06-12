require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Order = require('../models/Order');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([User.deleteMany(), Driver.deleteMany(), Order.deleteMany()]);
    console.log('🗑️  Cleared existing data');

    // Create admin
    const admin = await User.create({
      name: 'Admin AngkutCepat',
      email: 'admin@angkutcepat.id',
      phone: '08001234567',
      password: 'admin123',
      role: 'admin',
    });

    // Create customers
    const customers = await User.create([
      {
        name: 'Budi Santoso',
        email: 'budi@gmail.com',
        phone: '08111234567',
        password: 'password123',
        addresses: [
          { label: 'Rumah', address: 'Jl. Kebon Jeruk No. 10', city: 'Jakarta Barat', isDefault: true },
        ],
      },
      {
        name: 'Sari Dewi',
        email: 'sari@gmail.com',
        phone: '08211234567',
        password: 'password123',
        addresses: [
          { label: 'Apartemen', address: 'Jl. Sudirman No. 45 Blok B', city: 'Jakarta Selatan', isDefault: true },
        ],
      },
      {
        name: 'Ahmad Fauzi',
        email: 'ahmad@gmail.com',
        phone: '08311234567',
        password: 'password123',
      },
      {
        name: 'Rina Kusuma',
        email: 'rina@gmail.com',
        phone: '08411234567',
        password: 'password123',
      },
    ]);

    // Create drivers
    const drivers = await Driver.create([
      {
        name: 'Joko Widodo',
        email: 'joko.driver@angkutcepat.id',
        phone: '08511234567',
        password: 'driver123',
        licenseNumber: 'SIM-A-001-2024',
        vehicle: {
          plateNumber: 'B 1234 AC',
          type: 'truck_medium',
          brand: 'Mitsubishi',
          model: 'Colt Diesel',
          year: 2020,
          capacity: '3 Ton',
        },
        status: 'available',
        rating: { average: 4.8, count: 45 },
        totalTrips: 45,
        currentLocation: { lat: -6.2088, lng: 106.8456 },
      },
      {
        name: 'Slamet Raharjo',
        email: 'slamet.driver@angkutcepat.id',
        phone: '08611234567',
        password: 'driver123',
        licenseNumber: 'SIM-A-002-2024',
        vehicle: {
          plateNumber: 'B 5678 AC',
          type: 'pickup',
          brand: 'Toyota',
          model: 'Hilux',
          year: 2021,
          capacity: '1 Ton',
        },
        status: 'on_duty',
        rating: { average: 4.6, count: 32 },
        totalTrips: 32,
        currentLocation: { lat: -6.1944, lng: 106.8229 },
      },
      {
        name: 'Hendra Gunawan',
        email: 'hendra.driver@angkutcepat.id',
        phone: '08711234567',
        password: 'driver123',
        licenseNumber: 'SIM-B1-003-2024',
        vehicle: {
          plateNumber: 'B 9012 AC',
          type: 'truck_large',
          brand: 'Hino',
          model: 'Ranger',
          year: 2019,
          capacity: '8 Ton',
        },
        status: 'available',
        rating: { average: 4.9, count: 67 },
        totalTrips: 67,
        currentLocation: { lat: -6.2297, lng: 106.7539 },
      },
    ]);

    // Pricing helper (sesuai PRICING_CONFIG baru: paket bertingkat)
    const BASE_PACKAGE_KG = 10;
    const BASE_PACKAGE_PRICE = 200000;
    const EXCESS_PRICE_PER_KG = 15000;
    const PLATFORM_FEE_RATE = 0.20;
    const defaultWeights = {
      sofa: 45, kasur: 25, lemari: 60, elektronik: 15,
      meja: 20, kulkas: 55, mesin_cuci: 50, lainnya: 20,
    };
    const calcOrderPrice = (totalWeightKg) => {
      const base = totalWeightKg <= BASE_PACKAGE_KG
        ? BASE_PACKAGE_PRICE
        : BASE_PACKAGE_PRICE + (totalWeightKg - BASE_PACKAGE_KG) * EXCESS_PRICE_PER_KG;
      const fee = Math.round(base * PLATFORM_FEE_RATE);
      return { base, fee, total: base + fee, excessKg: Math.max(0, totalWeightKg - BASE_PACKAGE_KG) };
    };

    // Variasi pesanan yang lebih realistis
    const orderTemplates = [
      { category: 'sofa',       name: 'Sofa',          qty: 1, status: 'completed',  scheduledTime: '08:00 - 11:00' },
      { category: 'kasur',      name: 'Kasur',          qty: 2, status: 'completed',  scheduledTime: '09:00 - 12:00' },
      { category: 'lemari',     name: 'Lemari',         qty: 1, status: 'completed',  scheduledTime: '10:00 - 13:00' },
      { category: 'elektronik', name: 'Elektronik',     qty: 1, status: 'confirmed',  scheduledTime: '13:00 - 16:00' },
      { category: 'kulkas',     name: 'Kulkas',         qty: 1, status: 'assigned',   scheduledTime: '14:00 - 17:00' },
      { category: 'meja',       name: 'Meja',           qty: 2, status: 'pending',    scheduledTime: '09:00 - 12:00' },
      { category: 'mesin_cuci', name: 'Mesin Cuci',     qty: 1, status: 'completed',  scheduledTime: '08:00 - 11:00' },
      { category: 'sofa',       name: 'Sofa',           qty: 2, status: 'completed',  scheduledTime: '11:00 - 14:00' },
      { category: 'lainnya',    name: 'Barang Lainnya', qty: 3, status: 'pending',    scheduledTime: '15:00 - 18:00' },
      { category: 'kasur',      name: 'Kasur',          qty: 1, status: 'confirmed',  scheduledTime: '10:00 - 13:00' },
      { category: 'lemari',     name: 'Lemari',         qty: 2, status: 'completed',  scheduledTime: '07:00 - 10:00' },
      { category: 'elektronik', name: 'Elektronik',     qty: 2, status: 'assigned',   scheduledTime: '16:00 - 19:00' },
    ];

    const orders = [];
    for (let i = 0; i < orderTemplates.length; i++) {
      const t = orderTemplates[i];
      const customer = customers[i % customers.length];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30));

      const itemWeightKg = defaultWeights[t.category] || 20;
      const totalWeightKg = itemWeightKg * t.qty;
      const { base, fee, total, excessKg } = calcOrderPrice(totalWeightKg);

      orders.push({
        customer: customer._id,
        driver: t.status !== 'pending' ? drivers[i % drivers.length]._id : null,
        items: [
          {
            category: t.category,
            name: t.name,
            quantity: t.qty,
            condition: 'baik',
            weightKg: defaultWeights[t.category] || 20,
            estimatedPrice: 0,
          },
        ],
        pickupAddress: {
          address: `Jl. Contoh No. ${i + 1}`,
          city: 'Jakarta',
          contactName: customer.name,
          contactPhone: customer.phone,
        },
        scheduledDate: baseDate,
        scheduledTime: t.scheduledTime,
        status: t.status,
        statusHistory: [{ status: 'pending', note: 'Pesanan dibuat', updatedBy: 'customer' }],
        pricing: {
          basePrice: BASE_PACKAGE_PRICE,
          itemsTotal: excessKg * EXCESS_PRICE_PER_KG,
          platformFee: fee,
          distanceFee: 0,
          discount: 0,
          tax: 0,
          total,
        },
        payment: {
          method: ['cash', 'transfer', 'qris'][i % 3],
          status: t.status === 'completed' ? 'paid' : 'pending',
          paidAt: t.status === 'completed' ? new Date() : null,
        },
        createdAt: baseDate,
      });
    }

    await Order.insertMany(orders);

    console.log('✅ Seed data berhasil dibuat!\n');
    console.log('=== AKUN LOGIN ===');
    console.log('👤 Admin: admin@angkutcepat.id | admin123');
    console.log('👤 Customer: budi@gmail.com | password123');
    console.log('🚛 Driver: joko.driver@angkutcepat.id | driver123');
    console.log('=================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
