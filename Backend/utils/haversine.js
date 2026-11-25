const EARTH_RADIUS_KM = 6371;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Validate whether an object contains usable numeric latitude & longitude.
 * @param {object|null|undefined} loc
 * @returns {boolean}
 */
export function hasValidCoords(loc) {
  if (!loc || typeof loc !== 'object') return false;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (loc.lat === null || loc.lat === '' || loc.lng === null || loc.lng === '') {
    return false;
  }
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Calculate great-circle distance in kilometres using the Haversine formula.
 * Returns null if either coordinate pair is missing or invalid.
 */
export function calculateDistanceKm(from, to) {
  if (!hasValidCoords(from) || !hasValidCoords(to)) {
    return null;
  }
  const lat1 = Number(from.lat);
  const lng1 = Number(from.lng);
  const lat2 = Number(to.lat);
  const lng2 = Number(to.lng);

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

/**
 * Attach distanceKm & locationAvailable flags to listings, filter by radius
 * when coordinates and maxDistanceKm are supplied, and sort nearest-first.
 */
export function enrichAndFilterByDistance(items, userCoords, maxDistanceKm) {
  const userHasCoords = hasValidCoords(userCoords);
  const parsedRadius =
    maxDistanceKm !== undefined && maxDistanceKm !== null && maxDistanceKm !== ''
      ? Number(maxDistanceKm)
      : null;

  const enriched = items.map((doc) => {
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    const providerHasCoords = hasValidCoords(obj.location);
    const distanceKm = userHasCoords && providerHasCoords
      ? calculateDistanceKm(userCoords, obj.location)
      : null;

    return {
      ...obj,
      locationAvailable: providerHasCoords,
      distanceKm,
    };
  });

  const filtered =
    userHasCoords && Number.isFinite(parsedRadius) && parsedRadius > 0
      ? enriched.filter((item) => item.distanceKm !== null && item.distanceKm <= parsedRadius)
      : enriched;

  if (userHasCoords) {
    filtered.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  return filtered;
}
