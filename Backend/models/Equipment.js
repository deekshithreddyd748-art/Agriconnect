import mongoose from 'mongoose';

export const EQUIPMENT_CATEGORIES = [
  'Tractors',
  'Rotavators',
  'Harvesters',
  'Seed Drills',
  'Cultivators',
  'Sprayers',
  'Threshers',
  'Ploughing Equipment',
  'Water Pumps',
  'Other Agricultural Equipment',
];

export const EQUIPMENT_PRICE_UNITS = ['hour', 'day', 'acre'];

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: EQUIPMENT_CATEGORIES,
      required: [true, 'Equipment category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    images: {
      type: [String],
      default: [],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Rental price is required'],
      min: [0, 'Price must be positive'],
    },
    priceUnit: {
      type: String,
      enum: EQUIPMENT_PRICE_UNITS,
      default: 'hour',
    },
    availability: {
      type: Boolean,
      default: true,
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, trim: true, default: '' },
      village: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
    },
    serviceRadius: {
      type: Number,
      default: 15,
      min: 1,
      max: 200,
    },
    specifications: {
      brand: { type: String, trim: true, default: '' },
      horsepower: { type: String, trim: true, default: '' },
      year: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

const Equipment = mongoose.model('Equipment', equipmentSchema);
export default Equipment;
