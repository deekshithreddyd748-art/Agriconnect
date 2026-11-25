import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = [
  'farmer',
  'equipment_owner',
  'labour_provider',
  'facility_operator',
  'admin',
];

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    address: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      default: undefined,
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: undefined,
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: function passwordRequired() {
        return !this.mobileVerified;
      },
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'farmer',
    },
    language: {
      type: String,
      default: 'English',
      trim: true,
    },
    village: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    primaryCrop: {
      type: String,
      trim: true,
      default: '',
    },
    farmSize: {
      type: Number,
      min: 0,
      default: null,
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
    availability: {
      type: Boolean,
      default: true,
    },
    location: {
      type: locationSchema,
      default: () => ({ lat: null, lng: null, address: '' }),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
