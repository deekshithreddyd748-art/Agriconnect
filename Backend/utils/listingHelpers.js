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
 * Normalize location payloads from request bodies (supporting { lat, lng } and
 * GeoJSON { coordinates: [lng, lat] }), falling back to user profile address
 * metadata and rejecting out-of-range coordinates with HTTP 400.
 */
export function normalizeLocation(rawLocation, fallbackUser = {}) {
  const parsed = parseMaybeJson(rawLocation, {}) || {};

  let rawLat = parsed.lat;
  let rawLng = parsed.lng;

  if (Array.isArray(parsed.coordinates) && parsed.coordinates.length >= 2) {
    rawLng = parsed.coordinates[0];
    rawLat = parsed.coordinates[1];
  }

  const hasLat = rawLat !== undefined && rawLat !== null && rawLat !== '';
  const hasLng = rawLng !== undefined && rawLng !== null && rawLng !== '';

  if (hasLat !== hasLng) {
    throw new AppError(
      'Invalid GPS coordinates: both latitude and longitude are required.',
      400
    );
  }

  let lat = null;
  let lng = null;

  if (hasLat && hasLng) {
    const latNum = Number(rawLat);
    const lngNum = Number(rawLng);
    if (
      !Number.isFinite(latNum) ||
      !Number.isFinite(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      throw new AppError(
        'Invalid GPS coordinates: latitude must be between -90 and 90, and longitude between -180 and 180.',
        400
      );
    }
    lat = latNum;
    lng = lngNum;
  }

  return {
    lat,
    lng,
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
