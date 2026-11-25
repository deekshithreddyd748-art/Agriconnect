import mongoose from 'mongoose';

export const LABOUR_REQUEST_CATEGORIES = [
  'Sowing / Planting',
  'Harvesting',
  'Weeding',
  'Pesticide Spraying',
  'Tractor / Machinery Operator',
  'Irrigation Work',
  'General Farm Help',
  'Other',
];

export const LABOUR_REQUEST_STATUSES = [
  'Open',
  'Partially Filled',
  'Fully Filled',
  'In Progress',
  'Completed',
  'Cancelled',
];

const labourRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: LABOUR_REQUEST_CATEGORIES,
      required: [true, 'Labour category is required'],
    },
    workersRequired: {
      type: Number,
      required: [true, 'Number of workers required'],
      min: [1, 'At least 1 worker is required'],
      validate: {
        validator: Number.isInteger,
        message: 'Workers required must be a whole number',
      },
    },
    workersAccepted: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: String,
      required: [true, 'Work start date is required'],
    },
    durationDays: {
      type: Number,
      required: [true, 'Duration in days is required'],
      min: [0.5, 'Duration must be positive'],
    },
    dailyWage: {
      type: Number,
      required: [true, 'Daily wage is required'],
      min: [1, 'Daily wage must be a positive amount'],
    },
    estimatedTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      village: { type: String, required: [true, 'Work village/location is required'], trim: true },
      district: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    preferredHours: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: LABOUR_REQUEST_STATUSES,
      default: 'Open',
    },
  },
  { timestamps: true }
);

const LabourRequest = mongoose.model('LabourRequest', labourRequestSchema);
export default LabourRequest;
