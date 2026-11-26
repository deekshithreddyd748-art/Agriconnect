import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { normalizeLocation } from '../utils/listingHelpers.js';
import { getAuthCookieOptions } from './profileController.js';

function formatUser(user, profileId = null) {
  return {
    _id: user._id,
    profileId: profileId || user.supabaseProfileId || null,
    name: user.name,
    email: user.email || null,
    phone: user.phone,
    mobileNumber: user.mobileNumber,
    role: user.pendingRoleSelection ? null : user.role,
    language: user.language,
    village: user.village,
    district: user.district,
    state: user.state,
    primaryCrop: user.primaryCrop,
    farmSize: user.farmSize,
    farmSizeUnit: user.farmSizeUnit || 'acres',
    skills: user.skills,
    experience: user.experience,
    availability: user.availability,
    location: user.location,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export const logoutUser = asyncHandler(async (_req, res) => {
  res.clearCookie('agriconnect_token', {
    ...getAuthCookieOptions(),
    maxAge: undefined,
  });
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: formatUser(req.user, req.profileId),
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
    farmSizeUnit,
    skills,
    experience,
    availability,
    location,
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (name !== undefined && String(name).trim().length >= 2) {
    user.name = String(name).trim();
  }
  if (phone !== undefined) user.phone = phone;
  if (language !== undefined) user.language = language;
  if (village !== undefined) user.village = village;
  if (district !== undefined) user.district = district;
  if (state !== undefined) user.state = state;
  if (primaryCrop !== undefined) user.primaryCrop = primaryCrop;
  if (farmSize !== undefined) {
    user.farmSize = farmSize === '' || farmSize === null ? null : Number(farmSize);
  }
  if (farmSizeUnit !== undefined && ['acres', 'hectares'].includes(farmSizeUnit)) {
    user.farmSizeUnit = farmSizeUnit;
  }
  if (experience !== undefined) user.experience = experience;
  if (availability !== undefined) user.availability = availability;

  if (skills !== undefined) {
    user.skills = Array.isArray(skills)
      ? skills.map((s) => String(s).trim()).filter(Boolean)
      : String(skills)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
  }

  if (location) {
    const normalizedLoc = normalizeLocation(location, {
      village: village ?? user.village,
      district: district ?? user.district,
      state: state ?? user.state,
    });
    user.location = normalizedLoc;
  }

  await user.save();

  res.json({
    success: true,
    user: formatUser(user, req.profileId),
  });
});
