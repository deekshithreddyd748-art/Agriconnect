import jwt from 'jsonwebtoken';
import { AppError, asyncHandler } from './errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import { formatProfileRow, isValidUuid } from '../services/supabaseMappers.js';

function extractCookieToken(cookieHeader = '') {
  const cookies = cookieHeader.split(';');
  for (const part of cookies) {
    const [key, ...rest] = part.trim().split('=');
    if (key === 'agriconnect_token') {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

/**
 * Verify session JWT and load active profile from Supabase `public.profiles`.
 * Note: Tokens with authLevel === 'profile_demo' represent mobile profile lookup sessions,
 * NOT verified multi-factor authentication.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = extractCookieToken(req.headers.cookie);
  }

  if (!token) {
    throw new AppError('Authentication required. Please continue with your profile.', 401);
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured on the server.', 500, 'JWT_NOT_CONFIGURED');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const profileId = decoded.profileId || decoded.id;

  if (!isValidUuid(profileId)) {
    throw new AppError('Invalid or expired session. Please enter your profile again.', 401);
  }

  const supabase = getSupabaseClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, mobile_number, email, role, preferred_language, village, taluk, district, state, address, latitude, longitude, primary_crop, farm_size, farm_size_unit, profile_image, is_active, created_at, updated_at'
    )
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    throw new AppError(`Database error verifying session: ${error.message}`, 502);
  }
  if (!profile) {
    throw new AppError('Session profile no longer exists.', 401);
  }
  if (profile.is_active === false) {
    throw new AppError('This account has been deactivated.', 403);
  }

  req.user = formatProfileRow(profile, { includePrivate: true });
  req.authLevel = decoded.authLevel || 'profile_demo';
  req.profileId = profile.id;
  next();
});

/**
 * Restrict route access to one or more allowed roles.
 * Never grants admin access to unverified profile-identification sessions.
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    const effectiveRole = req.user?.role;
    if (roles.includes('admin') && req.authLevel === 'profile_demo') {
      return next(
        new AppError(
          'Profile-identification sessions cannot access administrator routes.',
          403,
          'ADMIN_SESSION_FORBIDDEN'
        )
      );
    }
    if (!req.user || !effectiveRole || !roles.includes(effectiveRole)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    return next();
  };
}
