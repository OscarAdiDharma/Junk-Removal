const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const itemSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['sofa', 'kasur', 'lemari', 'elektronik', 'meja', 'kursi', 'kulkas', 'mesin_cuci', 'lainnya'],
    required: true,
  },
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  weight: { type: Number }, // in kg
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  condition: {
    type: String,
    enum: ['baik', 'rusak_ringan', 'rusak_berat'],
    default: 'baik',
  },
  notes: { type: String },
  photo: { type: String, default: null },
  estimatedPrice: { type: Number, default: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      default: () => `AC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    items: [itemSchema],
    pickupAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      contactName: String,
      contactPhone: String,
    },
    dropoffAddress: {
      address: String,
      city: String,
      notes: String,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'assigned',
        'driver_heading',
        'pickup_arrived',
        'in_transit',
        'completed',
        'cancelled',
      ],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: String,
      },
    ],
    pricing: {
      basePrice: { type: Number, default: 0 },
      itemsTotal: { type: Number, default: 0 },
      distanceFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: ['cash', 'transfer', 'qris', 'ovo', 'gopay', 'dana'],
        default: 'cash',
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
      },
      paidAt: Date,
      invoiceUrl: String,
    },
    notes: { type: String },
    rating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ driver: 1, status: 1 });
orderSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('Order', orderSchema);
