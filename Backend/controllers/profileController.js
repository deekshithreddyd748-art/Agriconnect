import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

export const SELECTABLE_ROLES = [
  'farmer',
  'equipment_owner',
  'labour_provider',
  'facility_operator',
];

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

export function signProfileToken(mongoUserId, profileId) {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured on the server.', 500, 'JWT_NOT_CONFIGURED');
  }
  return jwt.sign(
    {
      id: String(mongoUserId),
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
    created_at: profile.created_at,
  };
}

export function formatAppUser(mongoUser, profile) {
  const effectiveRole = profile?.role ?? (mongoUser.pendingRoleSelection ? null : mongoUser.role);
  return {
    _id: mongoUser._id,
    profileId: profile?.id || mongoUser.supabaseProfileId || null,
    name: profile?.full_name || mongoUser.name,
    email: profile?.email ?? mongoUser.email ?? null,
    phone: mongoUser.phone,
    mobileNumber: profile?.mobile_number || mongoUser.mobileNumber,
    role: effectiveRole,
    language: mongoUser.language,
    village: mongoUser.village,
    district: mongoUser.district,
    state: mongoUser.state,
    primaryCrop: mongoUser.primaryCrop,
    farmSize: mongoUser.farmSize,
    farmSizeUnit: mongoUser.farmSizeUnit || 'acres',
    skills: mongoUser.skills,
    experience: mongoUser.experience,
    availability: mongoUser.availability,
    location: mongoUser.location,
    isActive: mongoUser.isActive,
    authLevel: 'profile_demo',
    createdAt: profile?.created_at || mongoUser.createdAt,
  };
}

async function syncMongoOperationalUser(profile) {
  let user = await User.findOne({
    $or: [
      { supabaseProfileId: profile.id },
      { mobileNumber: profile.mobile_number },
    ],
  });

  if (user?.role === 'admin') {
    throw new AppError(
      'Administrator accounts cannot sign in through public mobile profile identification.',
      403,
      'ADMIN_ROLE_FORBIDDEN'
    );
  }

  const targetRole = profile.role || 'farmer';
  const pendingRole = !profile.role;

  if (!user) {
    user = await User.create({
      supabaseProfileId: profile.id,
      name: profile.full_name,
      phone: `+91 ${profile.mobile_number}`,
      mobileNumber: profile.mobile_number,
      ...(profile.email ? { email: profile.email } : {}),
      role: targetRole,
      pendingRoleSelection: pendingRole,
    });
    return user;
  }

  user.supabaseProfileId = profile.id;
  user.name = profile.full_name;
  user.phone = `+91 ${profile.mobile_number}`;
  user.mobileNumber = profile.mobile_number;
  if (profile.email && !user.email) {
    user.email = profile.email;
  }
  user.pendingRoleSelection = pendingRole;
  if (profile.role) {
    user.role = profile.role;
  }
  await user.save();
  return user;
}

function detectProfileMismatch(existingProfile, submittedName, submittedEmail) {
  const existingNameNorm = String(existingProfile.full_name || '').trim().toLowerCase();
  const submittedNameNorm = submittedName.trim().toLowerCase();
  const nameMismatch = existingNameNorm !== submittedNameNorm;

  const existingEmailNorm = existingProfile.email
    ? String(existingProfile.email).trim().toLowerCase()
    : null;
  const emailMismatch =
    submittedEmail !== null && submittedEmail !== existingEmailNorm;

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
  syncUserFn = syncMongoOperationalUser,
  signTokenFn = signProfileToken,
}) {
  const fullName = normalizeFullName(body?.fullName ?? body?.full_name);
  const mobileNumber = normalizeIndianMobile(body?.mobileNumber ?? body?.mobile_number);
  const email = normalizeOptionalEmail(body?.email);
  const confirmUseExisting = Boolean(body?.confirmUseExisting);

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id, full_name, mobile_number, email, role, created_at')
    .eq('mobile_number', mobileNumber)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(
      `Failed to query Supabase profiles: ${fetchError.message}`,
      502,
      'SUPABASE_QUERY_FAILED'
    );
  }

  if (existing) {
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

    const mongoUser = await syncUserFn(existing);
    const token = signTokenFn(mongoUser._id, existing.id);
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
        user: formatAppUser(mongoUser, existing),
        token,
      },
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      full_name: fullName,
      mobile_number: mobileNumber,
      email,
      role: null,
    })
    .select('id, full_name, mobile_number, email, role, created_at')
    .single();

  if (insertError) {
    // Handle concurrent submission on the same mobile_number safely via PostgreSQL unique code 23505.
    if (insertError.code === '23505') {
      const { data: raceExisting, error: raceFetchErr } = await supabase
        .from('profiles')
        .select('id, full_name, mobile_number, email, role, created_at')
        .eq('mobile_number', mobileNumber)
        .single();

      if (raceFetchErr || !raceExisting) {
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

      const mongoUser = await syncUserFn(raceExisting);
      const token = signTokenFn(mongoUser._id, raceExisting.id);
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
          user: formatAppUser(mongoUser, raceExisting),
          token,
        },
      };
    }

    throw new AppError(
      `Failed to create Supabase profile: ${insertError.message}`,
      502,
      'SUPABASE_INSERT_FAILED'
    );
  }

  const mongoUser = await syncUserFn(inserted);
  const token = signTokenFn(mongoUser._id, inserted.id);
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
      user: formatAppUser(mongoUser, inserted),
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
  mongoUserId,
  supabase = getSupabaseClient(),
  syncUserFn = syncMongoOperationalUser,
}) {
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
    .select('id, full_name, mobile_number, email, role, created_at')
    .eq('id', profileId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(
      `Failed to read Supabase profile: ${fetchError.message}`,
      502,
      'SUPABASE_QUERY_FAILED'
    );
  }
  if (!existing) {
    throw new AppError('Profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  // Returning users keep their saved role and cannot silently overwrite it via role onboarding.
  if (existing.role) {
    if (existing.role !== role) {
      throw new AppError(
        `This profile already has a saved role (${existing.role}). Returning profiles preserve their existing role.`,
        409,
        'ROLE_ALREADY_SET',
        { savedRole: existing.role }
      );
    }
    const mongoUser = await syncUserFn(existing);
    return {
      statusCode: 200,
      payload: {
        success: true,
        profile: formatProfile(existing),
        user: formatAppUser(mongoUser, existing),
      },
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .is('role', null)
    .select('id, full_name, mobile_number, email, role, created_at')
    .maybeSingle();

  if (updateError) {
    throw new AppError(
      `Failed to save profile role in Supabase: ${updateError.message}`,
      502,
      'SUPABASE_UPDATE_FAILED'
    );
  }

  if (!updated) {
    throw new AppError(
      'Profile role was already set concurrently. Refresh to use your saved role.',
      409,
      'ROLE_ALREADY_SET'
    );
  }

  let mongoUser = mongoUserId ? await User.findById(mongoUserId) : null;
  if (mongoUser) {
    mongoUser.role = updated.role;
    mongoUser.pendingRoleSelection = false;
    await mongoUser.save();
  } else {
    mongoUser = await syncUserFn(updated);
  }

  return {
    statusCode: 200,
    payload: {
      success: true,
      profile: formatProfile(updated),
      user: formatAppUser(mongoUser, updated),
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
    mongoUserId: req.user?._id,
  });
  res.status(result.statusCode).json(result.payload);
});
