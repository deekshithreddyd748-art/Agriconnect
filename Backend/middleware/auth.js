import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError, asyncHandler } from './errorHandler.js';

function extractCookieToken(cookieHeader, name = 'agriconnect_token') {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(eqIdx + 1).trim());
    }
  }
  return null;
}

/**
 * Authenticate requests via Bearer JWT or HttpOnly cookie and attach user to req.user.
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
    throw new AppError('Authentication required. Please log in.', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    throw new AppError('Account no longer exists.', 401);
  }
  if (!user.isActive) {
    throw new AppError('This account has been deactivated by an administrator.', 403);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403);
  }

  req.user = user;
  req.authLevel = decoded.authLevel || 'legacy';
  req.profileId = decoded.profileId || user.supabaseProfileId || null;
  next();
});

/**
 * Restrict route access to one or more allowed roles.
 * Never grants admin access to unverified profile-identification sessions.
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    const effectiveRole = req.user?.pendingRoleSelection ? null : req.user?.role;
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
