import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { isValidCoordinates } from '../services/locationService';

const LocationContext = createContext(null);
const STORAGE_KEY = 'agriconnect_gps_location';

function readStoredLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidCoordinates(parsed?.lat, parsed?.lng) ? parsed : null;
  } catch {
    return null;
  }
}

export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [stored] = useState(() => readStoredLocation());
  const gps = useCurrentLocation(stored);

  const [radius, setRadius] = useState(15);
  const [regionFilter, setRegionFilter] = useState({
    village: '',
    district: '',
    state: '',
  });

  useEffect(() => {
    if (user && isValidCoordinates(user.location?.lat, user.location?.lng)) {
      gps.syncSavedLocation({
        lat: user.location.lat,
        lng: user.location.lng,
        village: user.village,
        district: user.district,
        state: user.state,
        address: user.location.address,
      });
    }
  }, [user, gps.syncSavedLocation]);

  useEffect(() => {
    if (gps.hasCoords && gps.location) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gps.location));
      } catch {
        // ignore storage errors
      }
    }
  }, [gps.hasCoords, gps.location]);

  async function detectBrowserLocation() {
    return gps.captureLocation();
  }

  function clearRegionFilter() {
    setRegionFilter({ village: '', district: '', state: '' });
  }

  const displayLabel = gps.hasCoords
    ? [
        gps.location?.village,
        gps.location?.district,
        gps.location?.state,
      ]
        .filter(Boolean)
        .join(', ') ||
      gps.location?.formattedAddress ||
      'GPS location captured'
    : [regionFilter.village, regionFilter.district, regionFilter.state]
        .filter(Boolean)
        .join(', ');

  return (
    <LocationContext.Provider
      value={{
        coords: gps.hasCoords ? { lat: gps.location.lat, lng: gps.location.lng } : null,
        location: gps.location,
        hasCoords: gps.hasCoords,
        gpsStatus: gps.status,
        reverseGeocodeOk: gps.reverseGeocodeOk,
        errorCode: gps.errorCode,
        detecting: gps.isDetecting,
        displayLabel,
        radius,
        setRadius,
        regionFilter,
        setRegionFilter,
        clearRegionFilter,
        detectBrowserLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used inside LocationProvider');
  return ctx;
}
