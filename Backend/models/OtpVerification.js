import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);
export default OtpVerification;
