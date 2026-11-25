import mongoose from 'mongoose';

export const BOOKING_STATUSES = [
  'Pending',
  'Accepted',
  'Rejected',
  'Cancelled',
  'Completed',
];

export const SERVICE_TYPES = ['equipment', 'labour', 'facility'];

const bookingSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      enum: SERVICE_TYPES,
      required: true,
    },
    serviceModel: {
      type: String,
      enum: ['Equipment', 'Labour', 'Facility'],
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'serviceModel',
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingDate: {
      type: String,
      required: [true, 'Booking date is required'],
    },
    duration: {
      type: Number,
      default: 1,
      min: 1,
    },
    durationUnit: {
      type: String,
      default: 'day',
      trim: true,
    },
    workersRequested: {
      type: Number,
      default: 1,
      min: 1,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    selectedService: {
      type: String,
      trim: true,
      default: '',
    },
    farmLocation: {
      address: { type: String, trim: true, default: '' },
      village: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    estimatedCost: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: 'Pay directly to provider upon service delivery (Cash / UPI)',
      trim: true,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'Pending',
    },
    providerNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
