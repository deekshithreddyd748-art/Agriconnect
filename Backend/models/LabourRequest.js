import mongoose from 'mongoose';

export const LABOUR_REQUEST_CATEGORIES = [
  'Sowing / Planting',
  'Sowing',
  'Transplanting',
  'Transplantation',
  'Weeding',
  'Harvesting',
  'Pesticide Spraying',
  'Spraying',
  'Tractor / Machinery Operator',
  'Irrigation Work',
  'Irrigation',
  'Land Preparation',
  'Fertilizer Application',
  'General Farm Help',
  'Other Agricultural Work',
  'Other',
];

export const LABOUR_REQUEST_STATUSES = [
  'Open',
  'Applications Received',
  'Pending',
  'Worker Accepted',
  'Partially Filled',
  'Filled',
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
    remainingVacancies: {
      type: Number,
      min: 0,
    },
    acceptedWorkerIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    startDate: {
      type: String,
      required: [true, 'Work start date is required'],
    },
    durationDays: {
      type: Number,
      default: 1,
      min: [0.5, 'Duration must be positive'],
    },
    dailyWage: {
      type: Number,
      default: 0,
      min: [0, 'Daily wage cannot be negative'],
    },
    budget: {
      type: Number,
      default: null,
      min: [0, 'Budget cannot be negative'],
    },
    farmSize: {
      type: Number,
      default: null,
      min: [0, 'Farm size cannot be negative'],
    },
    farmSizeUnit: {
      type: String,
      enum: ['acres', 'hectares'],
      default: 'acres',
    },
    estimatedTotal: {
      type: Number,
      default: 0,
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

labourRequestSchema.pre('save', function syncVacancies(next) {
  if (this.remainingVacancies === undefined || this.remainingVacancies === null) {
    this.remainingVacancies = Math.max(0, (this.workersRequired || 0) - (this.workersAccepted || 0));
  }
  next();
});

const LabourRequest = mongoose.model('LabourRequest', labourRequestSchema);
export default LabourRequest;
