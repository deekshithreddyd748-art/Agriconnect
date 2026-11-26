import jwt from 'jsonwebtoken';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatProfileRow,
  mapSupabaseError,
} from '../services/supabaseMappers.js';
import { uploadFilesToSupabaseStorage } from '../services/storageService.js';
import { normalizeLocation } from '../utils/listingHelpers.js';

export const SELECTABLE_ROLES = [
  'farmer',
  'equipment_owner',
  'labour_provider',
  'facility_operator',
];

const PROFILE_COLUMNS =
  'id, full_name, mobile_number, email, role, preferred_language, village, taluk, district, state, address, latitude, longitude, primary_crop, farm_size, farm_size_unit, profile_image, is_active, created_at, updated_at';

const PUBLIC_PROFILE_COLUMNS =
  'id, full_name, role, preferred_language, village, taluk, district, state, profile_image, is_active, created_at, updated_at';

export function normalizeFullName(raw) {
  const cleaned = String(raw || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (cleaned.length < 2 || cleaned.length > 100) {
    throw new AppError(
      'Please enter your full name (2 to 100 characters).',
      400,
      'INVALID_FULL_NAME'
    );
  }
  return cleaned;
}

export function normalizeIndianMobile(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  const tenDigits =
    digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;

  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    throw new AppError(
      'Please enter a valid 10-digit Indian mobile number starting with 6-9.',
      400,
      'INVALID_MOBILE'
    );
  }
  return tenDigits;
}

export function normalizeOptionalEmail(raw) {
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim().toLowerCase();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new AppError(
      'Please enter a valid email address or leave it blank.',
      400,
      'INVALID_EMAIL'
    );
  }
  return trimmed;
}

export function normalizeSelectableRole(raw) {
  const normalized = raw === 'facility_owner' ? 'facility_operator' : String(raw || '').trim();
  if (normalized === 'admin') {
    throw new AppError(
      'Administrator role cannot be selected from public profile onboarding.',
      403,
      'ADMIN_ROLE_FORBIDDEN'
    );
  }
  if (!SELECTABLE_ROLES.includes(normalized)) {
    throw new AppError(
      'Please choose one of: Farmer, Equipment Owner, Labour Provider, or Facility Owner.',
      400,
      'INVALID_ROLE'
    );
  }
  return normalized;
}

export function getAuthCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export function signProfileToken(profileId) {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured on the server.', 500, 'JWT_NOT_CONFIGURED');
  }
  return jwt.sign(
    {
      id: String(profileId),
      profileId: String(profileId),
      authLevel: 'profile_demo',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function formatProfile(profile) {
  return {
    id: profile.id,
    full_name: profile.full_name,
    mobile_number: profile.mobile_number,
    email: profile.email ?? null,
    role: profile.role ?? null,
    preferred_language: profile.preferred_language || 'en',
    village: profile.village || '',
    taluk: profile.taluk || '',
    district: profile.district || '',
    state: profile.state || '',
    profile_image: profile.profile_image || null,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

function detectProfileMismatch(existingProfile, submittedName, submittedEmail) {
  const existingNameNorm = String(existingProfile.full_name || '').trim().toLowerCase();
  const submittedNameNorm = submittedName.trim().toLowerCase();
  const nameMismatch = existingNameNorm !== submittedNameNorm;

  const existingEmailNorm = existingProfile.email
    ? String(existingProfile.email).trim().toLowerCase()
    : null;
  const emailMismatch = submittedEmail !== null && submittedEmail !== existingEmailNorm;

  return {
    conflictDetected: nameMismatch || emailMismatch,
    nameMismatch,
    emailMismatch,
  };
}

/**
 * Pure handler core (accepts optional Supabase client instance for deterministic testing).
 */
export async function handleContinueProfile({
  body,
  supabase = getSupabaseClient(),
  signTokenFn = signProfileToken,
}) {
  const fullName = normalizeFullName(body?.fullName ?? body?.full_name);
  const mobileNumber = normalizeIndianMobile(body?.mobileNumber ?? body?.mobile_number);
  const email = normalizeOptionalEmail(body?.email);
  const confirmUseExisting = Boolean(body?.confirmUseExisting);

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('mobile_number', mobileNumber)
    .maybeSingle();

  if (fetchError) {
    throw mapSupabaseError(fetchError, 'Failed to query Supabase profiles.');
  }

  if (existing) {
    if (existing.role === 'admin') {
      throw new AppError(
        'Administrator accounts cannot sign in through public mobile profile identification.',
        403,
        'ADMIN_ROLE_FORBIDDEN'
      );
    }
    if (existing.is_active === false) {
      throw new AppError('This profile has been deactivated.', 403, 'PROFILE_DEACTIVATED');
    }

    const mismatch = detectProfileMismatch(existing, fullName, email);
    if (mismatch.conflictDetected && !confirmUseExisting) {
      return {
        statusCode: 200,
        payload: {
          success: true,
          isNew: false,
          exists: true,
          conflictDetected: true,
          nameMismatch: mismatch.nameMismatch,
          emailMismatch: mismatch.emailMismatch,
          requiresRoleSelection: !existing.role,
          message:
            'An existing profile was found for this mobile number. Saved details were preserved and not overwritten.',
          profile: formatProfile(existing),
          user: null,
          token: null,
        },
      };
    }

    const token = signTokenFn(existing.id);
    return {
      statusCode: 200,
      token,
      payload: {
        success: true,
        isNew: false,
        exists: true,
        conflictDetected: false,
        nameMismatch: mismatch.nameMismatch,
        emailMismatch: mismatch.emailMismatch,
        requiresRoleSelection: !existing.role,
        profile: formatProfile(existing),
        user: formatProfileRow(existing, { includePrivate: true }),
        token,
      },
    };
  }

  const preferredLanguage = String(body?.preferred_language || body?.language || 'en').trim() || 'en';
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      full_name: fullName,
      mobile_number: mobileNumber,
      email,
      role: null,
      preferred_language: preferredLanguage,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: raceExisting, error: raceErr } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('mobile_number', mobileNumber)
        .single();

      if (raceErr || !raceExisting) {
        throw new AppError(
          'A profile with this mobile number already exists.',
          409,
          'DUPLICATE_MOBILE_PROFILE'
        );
      }

      const mismatch = detectProfileMismatch(raceExisting, fullName, email);
      if (mismatch.conflictDetected && !confirmUseExisting) {
        return {
          statusCode: 200,
          payload: {
            success: true,
            isNew: false,
            exists: true,
            conflictDetected: true,
            nameMismatch: mismatch.nameMismatch,
            emailMismatch: mismatch.emailMismatch,
            requiresRoleSelection: !raceExisting.role,
            message:
              'An existing profile was found for this mobile number. Saved details were preserved and not overwritten.',
            profile: formatProfile(raceExisting),
            user: null,
            token: null,
          },
        };
      }

      const token = signTokenFn(raceExisting.id);
      return {
        statusCode: 200,
        token,
        payload: {
          success: true,
          isNew: false,
          exists: true,
          conflictDetected: false,
          nameMismatch: false,
          emailMismatch: false,
          requiresRoleSelection: !raceExisting.role,
          profile: formatProfile(raceExisting),
          user: formatProfileRow(raceExisting, { includePrivate: true }),
          token,
        },
      };
    }

    throw mapSupabaseError(insertError, 'Failed to create profile in Supabase.');
  }

  const token = signTokenFn(inserted.id);
  return {
    statusCode: 201,
    token,
    payload: {
      success: true,
      isNew: true,
      exists: false,
      conflictDetected: false,
      nameMismatch: false,
      emailMismatch: false,
      requiresRoleSelection: true,
      profile: formatProfile(inserted),
      user: formatProfileRow(inserted, { includePrivate: true }),
      token,
    },
  };
}

/**
 * Pure handler core for PATCH /api/profiles/:id/role.
 */
export async function handleSelectProfileRole({
  profileId,
  sessionProfileId,
  rawRole,
  supabase = getSupabaseClient(),
}) {
  assertValidUuid(profileId, 'profile id');
  if (!sessionProfileId || String(sessionProfileId) !== String(profileId)) {
    throw new AppError(
      'You can only set the role for your own active profile.',
      403,
      'PROFILE_OWNERSHIP_REQUIRED'
    );
  }

  const role = normalizeSelectableRole(rawRole);

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', profileId)
    .maybeSingle();

  if (fetchError) {
    throw mapSupabaseError(fetchError, 'Failed to read Supabase profile.');
  }
  if (!existing) {
    throw new AppError('Profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  if (existing.role) {
    if (existing.role !== role) {
      throw new AppError(
        `This profile already has a saved role (${existing.role}). Returning profiles preserve their existing role.`,
        409,
        'ROLE_ALREADY_SET',
        { savedRole: existing.role }
      );
    }
    return {
      statusCode: 200,
      payload: {
        success: true,
        profile: formatProfile(existing),
        user: formatProfileRow(existing, { includePrivate: true }),
      },
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .is('role', null)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (updateError) {
    throw mapSupabaseError(updateError, 'Failed to save profile role.');
  }
  if (!updated) {
    throw new AppError(
      'Profile role was already set concurrently. Refresh to use your saved role.',
      409,
      'ROLE_ALREADY_SET'
    );
  }

  return {
    statusCode: 200,
    payload: {
      success: true,
      profile: formatProfile(updated),
      user: formatProfileRow(updated, { includePrivate: true }),
    },
  };
}

export const continueProfile = asyncHandler(async (req, res) => {
  const result = await handleContinueProfile({ body: req.body });
  if (result.token) {
    res.cookie('agriconnect_token', result.token, getAuthCookieOptions());
  }
  res.status(result.statusCode).json(result.payload);
});

export const selectProfileRole = asyncHandler(async (req, res) => {
  const result = await handleSelectProfileRole({
    profileId: req.params.id,
    sessionProfileId: req.profileId,
    rawRole: req.body?.role,
  });
  res.status(result.statusCode).json(result.payload);
});

export const getProfileById = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'profile id');
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error, 'Failed to fetch profile.');
  if (!row) throw new AppError('Profile not found.', 404, 'PROFILE_NOT_FOUND');

  res.json({
    success: true,
    profile: formatProfileRow(row, { includePrivate: false }),
  });
});

export const updateProfileById = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'profile id');
  if (String(req.profileId) !== id && req.user?.role !== 'admin') {
    throw new AppError('You can only update your own profile.', 403, 'FORBIDDEN');
  }

  const supabase = getSupabaseClient();
  const updates = {};

  const nextName = req.body?.full_name ?? req.body?.name;
  if (nextName !== undefined) {
    updates.full_name = normalizeFullName(nextName);
  }
  const nextEmail = req.body?.email;
  if (nextEmail !== undefined) {
    updates.email = normalizeOptionalEmail(nextEmail);
  }
  const nextLang = req.body?.preferred_language ?? req.body?.language;
  if (nextLang !== undefined && String(nextLang).trim()) {
    updates.preferred_language = String(nextLang).trim();
  }
  if (req.body?.village !== undefined) updates.village = String(req.body.village).trim();
  if (req.body?.taluk !== undefined) updates.taluk = String(req.body.taluk).trim();
  if (req.body?.district !== undefined) updates.district = String(req.body.district).trim();
  if (req.body?.state !== undefined) updates.state = String(req.body.state).trim();
  if (req.body?.primaryCrop !== undefined || req.body?.primary_crop !== undefined) {
    updates.primary_crop = String(req.body.primary_crop ?? req.body.primaryCrop ?? '').trim();
  }
  if (req.body?.farmSize !== undefined || req.body?.farm_size !== undefined) {
    const rawSize = req.body.farm_size ?? req.body.farmSize;
    if (rawSize === '' || rawSize === null) {
      updates.farm_size = null;
    } else {
      const n = Number(rawSize);
      if (!Number.isFinite(n) || n < 0) {
        throw new AppError('Farm size cannot be negative.', 400);
      }
      updates.farm_size = n;
    }
  }
  const sizeUnit = req.body?.farm_size_unit ?? req.body?.farmSizeUnit;
  if (sizeUnit && ['acres', 'hectares'].includes(sizeUnit)) {
    updates.farm_size_unit = sizeUnit;
  }

  if (
    req.body?.location ||
    req.body?.latitude !== undefined ||
    req.body?.longitude !== undefined ||
    req.body?.address !== undefined
  ) {
    const loc = normalizeLocation(
      req.body.location || {
        lat: req.body.latitude,
        lng: req.body.longitude,
        address: req.body.address,
        village: updates.village ?? req.user.village,
        district: updates.district ?? req.user.district,
        state: updates.state ?? req.user.state,
      },
      req.user
    );
    updates.latitude = loc.lat;
    updates.longitude = loc.lng;
    updates.address = loc.address;
    if (loc.village) updates.village = loc.village;
    if (loc.district) updates.district = loc.district;
    if (loc.state) updates.state = loc.state;
  }

  if (Array.isArray(req.files) && req.files.length > 0) {
    const uploaded = await uploadFilesToSupabaseStorage({
      files: [req.files[0]],
      bucket: 'profile-images',
      ownerId: id,
      supabase,
    });
    if (uploaded[0]) updates.profile_image = uploaded[0];
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid profile fields provided for update.', 400);
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw mapSupabaseError(error, 'Failed to update profile.');

  res.json({
    success: true,
    profile: formatProfile(updated),
    user: formatProfileRow(updated, { includePrivate: true }),
  });
});
