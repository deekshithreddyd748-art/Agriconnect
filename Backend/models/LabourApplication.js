import mongoose from 'mongoose';

export const APPLICATION_STATUSES = [
  'Pending',
  'Accepted',
  'Rejected',
  'Withdrawn',
];

const labourApplicationSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabourRequest',
      required: true,
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workerName: {
      type: String,
      required: true,
      trim: true,
    },
    workerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    workerVillage: {
      type: String,
      trim: true,
      default: '',
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
    message: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'Pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

labourApplicationSchema.index({ requestId: 1, workerId: 1 }, { unique: true });

const LabourApplication = mongoose.model('LabourApplication', labourApplicationSchema);
export default LabourApplication;
