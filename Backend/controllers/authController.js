import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OtpVerification from '../models/OtpVerification.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { normalizeLocation } from '../utils/listingHelpers.js';

const SELF_REGISTER_ROLES = [
  'farmer',
  'equipment_owner',
  'labour_provider',
  'facility_operator',
];

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function normalizeIndianMobile(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  const tenDigits = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0')
      ? digits.slice(1)
      : digits;

  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    throw new AppError(
      'Please enter a valid 10-digit Indian mobile number starting with 6-9.',
      400
    );
  }
  return tenDigits;
}

function hashOtp(otp) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'agriconnect_otp_salt')
    .update(String(otp))
    .digest('hex');
}

function formatUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    mobileNumber: user.mobileNumber,
    mobileVerified: user.mobileVerified,
    role: user.role,
    language: user.language,
    village: user.village,
    district: user.district,
    state: user.state,
    primaryCrop: user.primaryCrop,
    farmSize: user.farmSize,
    skills: user.skills,
    experience: user.experience,
    availability: user.availability,
    location: user.location,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    confirmPassword,
    role = 'farmer',
    language = 'English',
    village = '',
    district = '',
    state = '',
    primaryCrop = '',
    farmSize = null,
    location,
  } = req.body;

  if (confirmPassword !== undefined && confirmPassword !== password) {
    throw new AppError('Password and confirm password do not match.', 400);
  }

  const normalizedRole = role === 'facility_owner' ? 'facility_operator' : role;
  if (!SELF_REGISTER_ROLES.includes(normalizedRole)) {
    throw new AppError('Invalid user role selected for registration.', 400);
  }

  const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
  if (normalizedEmail) {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }
  }

  let normalizedMobile;
  try {
    normalizedMobile = normalizeIndianMobile(phone);
  } catch {
    normalizedMobile = undefined;
  }

  if (normalizedMobile) {
    const existingMobile = await User.findOne({ mobileNumber: normalizedMobile });
    if (existingMobile) {
      throw new AppError('An account with this mobile number already exists.', 409);
    }
  }

  const normalizedLoc = normalizeLocation(location, {
    village,
    district,
    state,
  });

  const user = await User.create({
    name,
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
    phone,
    ...(normalizedMobile ? { mobileNumber: normalizedMobile } : {}),
    password,
    role: normalizedRole,
    language,
    village,
    district,
    state,
    primaryCrop,
    farmSize: farmSize !== null && farmSize !== '' ? Number(farmSize) : null,
    location: {
      lat: normalizedLoc.lat,
      lng: normalizedLoc.lng,
      address:
        normalizedLoc.address ||
        [village, district, state].filter(Boolean).join(', '),
    },
  });

  const token = signToken(user._id);
  res.status(201).json({
    success: true,
    token,
    user: formatUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+password'
  );

  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }
  if (!user.isActive) {
    throw new AppError('This account is deactivated. Contact support.', 403);
  }

  const token = signToken(user._id);
  res.json({
    success: true,
    token,
    user: formatUser(user),
  });
});

export const sendOtp = asyncHandler(async (req, res) => {
  const mobileNumber = normalizeIndianMobile(req.body.mobileNumber);

  const smsConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
  const allowDemoOtp =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_OTP === 'true';

  if (!smsConfigured && !allowDemoOtp) {
    throw new AppError(
      'SMS OTP service is not configured for production. Contact administrator.',
      503
    );
  }

  const otp = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OtpVerification.findOneAndUpdate(
    { mobileNumber },
    {
      mobileNumber,
      otpHash: hashOtp(otp),
      expiresAt,
      attempts: 0,
      verified: false,
    },
    { upsert: true, new: true }
  );

  // If production SMS gateway credentials exist, integrate provider dispatch here.
  res.json({
    success: true,
    message: smsConfigured
      ? 'OTP sent via SMS.'
      : 'Development mock OTP generated (SMS gateway not connected).',
    mobileNumber,
    expiresInSeconds: 300,
    demoOtpMode: !smsConfigured,
    ...(!smsConfigured ? { mockOtp: otp } : {}),
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const mobileNumber = normalizeIndianMobile(req.body.mobileNumber);
  const otp = String(req.body.otp || '').trim();

  if (!/^\d{6}$/.test(otp)) {
    throw new AppError('Please enter the 6-digit OTP.', 400);
  }

  const record = await OtpVerification.findOne({ mobileNumber });
  if (!record || record.expiresAt < new Date()) {
    throw new AppError('OTP has expired or was not requested. Please resend OTP.', 400);
  }
  if (record.attempts >= 5) {
    throw new AppError('Too many failed OTP attempts. Please request a new OTP.', 429);
  }

  const expectedBuf = Buffer.from(record.otpHash, 'hex');
  const providedBuf = Buffer.from(hashOtp(otp), 'hex');
  const isMatch =
    expectedBuf.length === providedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    throw new AppError('Invalid OTP. Please check the 6-digit code and try again.', 400);
  }

  record.verified = true;
  await record.save();

  const existingUser = await User.findOne({ mobileNumber });
  if (existingUser) {
    if (!existingUser.isActive) {
      throw new AppError('This account is deactivated. Contact support.', 403);
    }
    if (!existingUser.mobileVerified) {
      existingUser.mobileVerified = true;
      await existingUser.save();
    }
    const token = signToken(existingUser._id);
    return res.json({
      success: true,
      isNewUser: false,
      token,
      user: formatUser(existingUser),
    });
  }

  const verificationToken = jwt.sign(
    { mobileNumber, purpose: 'mobile_verified' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return res.json({
    success: true,
    isNewUser: true,
    mobileNumber,
    verificationToken,
  });
});

export const completeOtpOnboarding = asyncHandler(async (req, res) => {
  const {
    verificationToken,
    name,
    role = 'farmer',
    village,
    district,
    state = '',
    primaryCrop = '',
    farmSize = null,
    skills = [],
    experience = '',
    language = 'English',
    location,
  } = req.body;

  if (!verificationToken) {
    throw new AppError('Mobile verification token is required.', 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
  } catch {
    throw new AppError(
      'Mobile verification expired. Please verify your mobile number again.',
      401
    );
  }

  if (decoded.purpose !== 'mobile_verified' || !decoded.mobileNumber) {
    throw new AppError('Invalid mobile verification token.', 400);
  }

  const normalizedRole = role === 'facility_owner' ? 'facility_operator' : role;
  if (!SELF_REGISTER_ROLES.includes(normalizedRole)) {
    throw new AppError('Invalid role selected.', 400);
  }

  const existing = await User.findOne({ mobileNumber: decoded.mobileNumber });
  if (existing) {
    const token = signToken(existing._id);
    return res.json({
      success: true,
      token,
      user: formatUser(existing),
    });
  }

  const normalizedLoc = normalizeLocation(location, {
    village,
    district,
    state,
  });

  const normalizedSkills = Array.isArray(skills)
    ? skills.map((s) => String(s).trim()).filter(Boolean)
    : String(skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const user = await User.create({
    name,
    phone: `+91 ${decoded.mobileNumber}`,
    mobileNumber: decoded.mobileNumber,
    mobileVerified: true,
    role: normalizedRole,
    language,
    village,
    district,
    state,
    primaryCrop,
    farmSize: farmSize !== null && farmSize !== '' ? Number(farmSize) : null,
    skills: normalizedSkills,
    experience,
    location: {
      lat: normalizedLoc.lat,
      lng: normalizedLoc.lng,
      address:
        normalizedLoc.address ||
        [village, district, state].filter(Boolean).join(', '),
    },
  });

  const token = signToken(user._id);
  return res.status(201).json({
    success: true,
    token,
    user: formatUser(user),
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: formatUser(req.user),
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    language,
    village,
    district,
    state,
    primaryCrop,
    farmSize,
    skills,
    experience,
    availability,
    location,
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (language !== undefined) user.language = language;
  if (village !== undefined) user.village = village;
  if (district !== undefined) user.district = district;
  if (state !== undefined) user.state = state;
  if (primaryCrop !== undefined) user.primaryCrop = primaryCrop;
  if (farmSize !== undefined) {
    user.farmSize = farmSize === '' || farmSize === null ? null : Number(farmSize);
  }
  if (skills !== undefined) {
    user.skills = Array.isArray(skills)
      ? skills.map((s) => String(s).trim()).filter(Boolean)
      : String(skills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
  }
  if (experience !== undefined) user.experience = experience;
  if (availability !== undefined) user.availability = Boolean(availability);

  if (location !== undefined) {
    const normalized = normalizeLocation(location, user);
    user.location = {
      lat: normalized.lat,
      lng: normalized.lng,
      address:
        normalized.address ||
        [user.village, user.district, user.state].filter(Boolean).join(', '),
    };
  }

  await user.save();
  res.json({
    success: true,
    user: formatUser(user),
  });
});
