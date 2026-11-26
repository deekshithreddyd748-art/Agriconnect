import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import { formatProfileRow, mapSupabaseError } from '../services/supabaseMappers.js';
import { normalizeLocation } from '../utils/listingHelpers.js';
import {
  getAuthCookieOptions,
  normalizeFullName,
} from './profileController.js';

const PROFILE_COLUMNS =
  'id, full_name, mobile_number, email, role, preferred_language, village, taluk, district, state, address, latitude, longitude, primary_crop, farm_size, farm_size_unit, profile_image, is_active, created_at, updated_at';

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
    user: req.user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    full_name,
    language,
    preferred_language,
    village,
    taluk,
    district,
    state,
    primaryCrop,
    primary_crop,
    farmSize,
    farm_size,
    farmSizeUnit,
    farm_size_unit,
    location,
  } = req.body || {};

  const supabase = getSupabaseClient();
  const updates = {};

  if ((name ?? full_name) !== undefined) {
    updates.full_name = normalizeFullName(name ?? full_name);
  }
  if ((preferred_language ?? language) !== undefined) {
    updates.preferred_language = String(preferred_language ?? language).trim() || 'en';
  }
  if (village !== undefined) updates.village = String(village).trim();
  if (taluk !== undefined) updates.taluk = String(taluk).trim();
  if (district !== undefined) updates.district = String(district).trim();
  if (state !== undefined) updates.state = String(state).trim();
  if ((primary_crop ?? primaryCrop) !== undefined) {
    updates.primary_crop = String(primary_crop ?? primaryCrop ?? '').trim();
  }
  if ((farm_size ?? farmSize) !== undefined) {
    const raw = farm_size ?? farmSize;
    if (raw === '' || raw === null) {
      updates.farm_size = null;
    } else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) {
        throw new AppError('Farm size cannot be negative.', 400);
      }
      updates.farm_size = n;
    }
  }
  const unit = farm_size_unit ?? farmSizeUnit;
  if (unit && ['acres', 'hectares'].includes(unit)) {
    updates.farm_size_unit = unit;
  }

  if (location) {
    const normalizedLoc = normalizeLocation(location, {
      village: village ?? req.user.village,
      district: district ?? req.user.district,
      state: state ?? req.user.state,
      location: req.user.location,
    });
    updates.latitude = normalizedLoc.lat;
    updates.longitude = normalizedLoc.lng;
    updates.address = normalizedLoc.address;
    if (normalizedLoc.village) updates.village = normalizedLoc.village;
    if (normalizedLoc.district) updates.district = normalizedLoc.district;
    if (normalizedLoc.state) updates.state = normalizedLoc.state;
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw mapSupabaseError(error, 'Failed to update profile.');

  res.json({
    success: true,
    user: formatProfileRow(updated, { includePrivate: true }),
  });
});
