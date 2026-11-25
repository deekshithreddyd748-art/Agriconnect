import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      default: 'local',
      trim: true,
    },
    remoteVerification: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    requestWindowStart: {
      type: Date,
      default: Date.now,
    },
    requestCount: {
      type: Number,
      default: 1,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 900 });

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);
export default OtpVerification;
