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

    // Create sample orders
    const statuses = ['pending', 'confirmed', 'assigned', 'completed', 'completed', 'completed'];
    const itemCategories = ['sofa', 'kasur', 'lemari', 'elektronik', 'meja', 'kulkas'];

    const orders = [];
    for (let i = 0; i < 12; i++) {
      const status = statuses[i % statuses.length];
      const customer = customers[i % customers.length];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30));

      orders.push({
        customer: customer._id,
        driver: status !== 'pending' ? drivers[i % drivers.length]._id : null,
        items: [
          {
            category: itemCategories[i % itemCategories.length],
            name: itemCategories[i % itemCategories.length].charAt(0).toUpperCase() + itemCategories[i % itemCategories.length].slice(1),
            quantity: Math.floor(Math.random() * 2) + 1,
            condition: 'baik',
            estimatedPrice: 60000 + (i * 5000),
          },
        ],
        pickupAddress: {
          address: `Jl. Contoh No. ${i + 1}`,
          city: 'Jakarta',
          contactName: customer.name,
          contactPhone: customer.phone,
        },
        scheduledDate: baseDate,
        scheduledTime: '09:00 - 12:00',
        status,
        statusHistory: [{ status: 'pending', note: 'Pesanan dibuat', updatedBy: 'customer' }],
        pricing: {
          basePrice: 50000,
          itemsTotal: 60000 + (i * 5000),
          distanceFee: 0,
          discount: 0,
          total: 110000 + (i * 5000),
        },
        payment: {
          method: ['cash', 'transfer', 'qris'][i % 3],
          status: status === 'completed' ? 'paid' : 'pending',
          paidAt: status === 'completed' ? new Date() : null,
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
