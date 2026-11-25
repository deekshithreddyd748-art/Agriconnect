const EARTH_RADIUS_KM = 6371;

export function hasValidCoords(loc) {
  if (!loc || typeof loc !== 'object') return false;
  if (loc.lat === null || loc.lat === '' || loc.lng === null || loc.lng === '') {
    return false;
  }
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function calculateDistanceKm(from, to) {
  if (!hasValidCoords(from) || !hasValidCoords(to)) return null;
  const lat1 = (Number(from.lat) * Math.PI) / 180;
  const lat2 = (Number(to.lat) * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((Number(to.lng) - Number(from.lng)) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

export function formatDistanceLabel(item) {
  if (!item?.locationAvailable && !hasValidCoords(item?.location)) {
    return 'Location unavailable';
  }
  if (item?.distanceKm !== null && item?.distanceKm !== undefined) {
    return `${item.distanceKm} km away`;
  }
  return 'Set location for distance';
}

export function resolveImageUrl(path) {
  if (!path) return '/images/placeholder.svg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) {
    const base = import.meta.env.VITE_ASSET_URL || 'http://localhost:5000';
    return `${base}${path}`;
  }
  return path;
}

export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}
