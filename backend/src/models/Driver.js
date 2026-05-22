const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama supir wajib diisi'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Nomor telepon wajib diisi'],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Nomor SIM wajib diisi'],
      unique: true,
    },
    vehicle: {
      plateNumber: { type: String, required: true },
      type: {
        type: String,
        enum: ['pickup', 'truck_small', 'truck_medium', 'truck_large'],
        required: true,
      },
      brand: { type: String },
      model: { type: String },
      year: { type: Number },
      capacity: { type: String }, // in kg or m3
    },
    status: {
      type: String,
      enum: ['available', 'on_duty', 'off_duty', 'inactive'],
      default: 'available',
    },
    currentLocation: {
      lat: { type: Number, default: -6.2 },
      lng: { type: Number, default: 106.8 },
      updatedAt: { type: Date, default: Date.now },
    },
    rating: {
      average: { type: Number, default: 5.0 },
      count: { type: Number, default: 0 },
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const bcrypt = require('bcryptjs');

driverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

driverSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

driverSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Driver', driverSchema);
