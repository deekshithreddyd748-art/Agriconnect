const CACHE_PREFIX = 'agriconnect_revgeo_';
const MIN_REQUEST_INTERVAL_MS = 1100;
let lastRequestTimestamp = 0;

export function isValidCoordinates(lat, lng) {
  if (lat === null || lat === undefined || lat === '') return false;
  if (lng === null || lng === undefined || lng === '') return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    Number.isFinite(nLat) &&
    Number.isFinite(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180
  );
}

function getCacheKey(lat, lng) {
  return `${CACHE_PREFIX}${Number(lat).toFixed(3)}_${Number(lng).toFixed(3)}`;
}

function readCachedAddress(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedAddress(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Reverse geocode GPS coordinates into human-readable administrative fields
 * via OpenStreetMap Nominatim. Never throws on network/rate-limit failure;
 * returns { ok: false } so captured GPS coordinates are always preserved.
 */
export async function reverseGeocode(lat, lng, signal) {
  if (!isValidCoordinates(lat, lng)) {
    return { ok: false, village: '', district: '', state: '', formattedAddress: '' };
  }

  const key = getCacheKey(lat, lng);
  const cached = readCachedAddress(key);
  if (cached) {
    return { ok: true, ...cached };
  }

  const now = Date.now();
  const waitMs = Math.max(0, MIN_REQUEST_INTERVAL_MS - (now - lastRequestTimestamp));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  if (signal?.aborted) {
    return { ok: false, village: '', district: '', state: '', formattedAddress: '' };
  }

  lastRequestTimestamp = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&addressdetails=1`;

    const res = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return { ok: false, village: '', district: '', state: '', formattedAddress: '' };
    }

    const data = await res.json();
    const addr = data?.address || {};

    const village =
      addr.village ||
      addr.hamlet ||
      addr.town ||
      addr.suburb ||
      addr.city ||
      '';
    const district =
      addr.state_district ||
      addr.county ||
      addr.district ||
      addr.city ||
      '';
    const state = addr.state || '';
    const formattedAddress = data?.display_name || [village, district, state].filter(Boolean).join(', ');

    const resolved = { village, district, state, formattedAddress };
    writeCachedAddress(key, resolved);

    return { ok: true, ...resolved };
  } catch {
    return { ok: false, village: '', district: '', state: '', formattedAddress: '' };
  }
}
