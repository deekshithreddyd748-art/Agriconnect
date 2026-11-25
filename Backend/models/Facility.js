import mongoose from 'mongoose';

export const FACILITY_CATEGORIES = [
  'Warehouses',
  'Cold Storage',
  'Grain Drying Units',
  'Rice Mills',
  'Flour Mills',
  'Sorting and Grading Units',
  'Packaging Facilities',
];

const facilitySchema = new mongoose.Schema(
  {
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: FACILITY_CATEGORIES,
      required: [true, 'Facility category is required'],
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
    capacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    availableCapacity: {
      type: Number,
      required: [true, 'Available capacity is required'],
      min: [0, 'Available capacity cannot be negative'],
    },
    capacityUnit: {
      type: String,
      default: 'tons',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Service charge is required'],
      min: [0, 'Price must be positive'],
    },
    priceUnit: {
      type: String,
      default: 'per ton/day',
      trim: true,
    },
    operatingHours: {
      type: String,
      default: '06:00 AM - 08:00 PM',
      trim: true,
    },
    servicesOffered: {
      type: [String],
      default: [],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, trim: true, default: '' },
      village: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

const Facility = mongoose.model('Facility', facilitySchema);
export default Facility;
