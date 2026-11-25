import { AppError } from '../middleware/errorHandler.js';

/**
 * Parse JSON fields safely when multipart/form-data sends stringified JSON.
 */
export function parseMaybeJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

/**
 * Normalize location payloads from request bodies, falling back to user profile
 * address metadata (while keeping coordinates null unless explicitly valid).
 */
export function normalizeLocation(rawLocation, fallbackUser = {}) {
  const parsed = parseMaybeJson(rawLocation, {}) || {};
  const latNum =
    parsed.lat !== undefined && parsed.lat !== null && parsed.lat !== ''
      ? Number(parsed.lat)
      : null;
  const lngNum =
    parsed.lng !== undefined && parsed.lng !== null && parsed.lng !== ''
      ? Number(parsed.lng)
      : null;

  const validCoords =
    latNum !== null &&
    lngNum !== null &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180;

  return {
    lat: validCoords ? latNum : null,
    lng: validCoords ? lngNum : null,
    address: parsed.address ?? fallbackUser.location?.address ?? '',
    village: parsed.village ?? fallbackUser.village ?? '',
    district: parsed.district ?? fallbackUser.district ?? '',
    state: parsed.state ?? fallbackUser.state ?? '',
  };
}

/**
 * Extract uploaded file paths and optional external image URLs.
 */
export function collectImages(req, existingImages = []) {
  const uploaded = Array.isArray(req.files)
    ? req.files.map((file) => `/uploads/${file.filename}`)
    : [];

  const bodyImages = parseMaybeJson(req.body.images, null);
  const kept = Array.isArray(bodyImages)
    ? bodyImages.filter((url) => typeof url === 'string' && url.trim() !== '')
    : existingImages;

  return [...kept, ...uploaded];
}

/**
 * Ensure the current user owns the listing or is an admin.
 */
export function assertOwnershipOrAdmin(doc, ownerField, user) {
  if (!doc) {
    throw new AppError('Listing not found.', 404);
  }
  const ownerId = doc[ownerField]?._id?.toString() || doc[ownerField]?.toString();
  if (user.role !== 'admin' && ownerId !== user._id.toString()) {
    throw new AppError('You can only modify your own listings.', 403);
  }
}

/**
 * Parse query coordinates for hyperlocal discovery.
 */
export function extractQueryCoords(query) {
  const { lat, lng, radius } = query;
  return {
    userCoords: { lat, lng },
    radiusKm: radius,
  };
}
