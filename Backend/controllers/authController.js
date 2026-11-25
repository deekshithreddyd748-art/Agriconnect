import jwt from 'jsonwebtoken';
import User from '../models/User.js';
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

function formatUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    language: user.language,
    village: user.village,
    district: user.district,
    state: user.state,
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
    location,
  } = req.body;

  if (confirmPassword !== undefined && confirmPassword !== password) {
    throw new AppError('Password and confirm password do not match.', 400);
  }

  const normalizedRole = role === 'facility_owner' ? 'facility_operator' : role;
  if (!SELF_REGISTER_ROLES.includes(normalizedRole)) {
    throw new AppError('Invalid user role selected for registration.', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const normalizedLoc = normalizeLocation(location, {
    village,
    district,
    state,
  });

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: normalizedRole,
    language,
    village,
    district,
    state,
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

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: formatUser(req.user),
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, language, village, district, state, location } = req.body;
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
