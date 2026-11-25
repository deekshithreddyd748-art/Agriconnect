import mongoose from 'mongoose';

export const LABOUR_BOOKING_STATUSES = [
  'Accepted',
  'In Progress',
  'Completed',
  'Cancelled',
];

const labourBookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    labourRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabourRequest',
      required: true,
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: LABOUR_BOOKING_STATUSES,
      default: 'Accepted',
    },
  },
  { timestamps: true }
);

labourBookingSchema.index({ labourRequestId: 1, workerId: 1 }, { unique: true });

const LabourBooking = mongoose.model('LabourBooking', labourBookingSchema);
export default LabourBooking;
