import mongoose from 'mongoose';

export const LABOUR_CATEGORIES = [
  'Harvesting',
  'Sowing',
  'Transplantation',
  'Weeding',
  'Spraying',
  'Irrigation',
  'General Farm Labour',
];

const labourSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    category: {
      type: String,
      enum: LABOUR_CATEGORIES,
      required: [true, 'Labour category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      trim: true,
      default: '',
    },
    workersAvailable: {
      type: Number,
      required: [true, 'Number of available workers is required'],
      min: [1, 'At least 1 worker is required'],
    },
    pricePerWorker: {
      type: Number,
      required: [true, 'Price per worker is required'],
      min: [0, 'Price must be positive'],
    },
    priceUnit: {
      type: String,
      enum: ['day', 'hour'],
      default: 'day',
    },
    availability: {
      type: Boolean,
      default: true,
    },
    availableDates: {
      type: [String],
      default: [],
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
    isReported: { type: Boolean, default: false },
    reportReason: { type: String, trim: true, default: '' },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reportedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Labour = mongoose.model('Labour', labourSchema);
export default Labour;
