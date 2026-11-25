import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { hasValidCoords } from '../utils/distance';

const LocationContext = createContext(null);
const STORAGE_KEY = 'agriconnect_location';

export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [coords, setCoords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return {
      lat: 18.1517,
      lng: 74.5777,
      label: 'Baramati, Pune (Default Demo Location)',
    };
  });
  const [radius, setRadius] = useState(15);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (user && hasValidCoords(user.location)) {
      const next = {
        lat: user.location.lat,
        lng: user.location.lng,
        label:
          [user.village, user.district].filter(Boolean).join(', ') ||
          user.location.address ||
          'Saved Profile Location',
      };
      setCoords(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [user]);

  function setManualLocation({ lat, lng, label }) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      toast.error('Please enter valid numeric latitude and longitude.');
      return;
    }
    const next = {
      lat: parsedLat,
      lng: parsedLng,
      label: label || `${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`,
    };
    setCoords(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function clearLocation() {
    const cleared = { lat: null, lng: null, label: 'Location not set' };
    setCoords(cleared);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
  }

  function detectBrowserLocation() {
    if (!navigator.geolocation) {
      toast.error('Browser geolocation is not supported on this device.');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          label: `GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`,
        };
        setCoords(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setDetecting(false);
        toast.success('Current GPS location updated.');
      },
      () => {
        setDetecting(false);
        toast.error(
          'Location permission denied. You can choose a town or enter coordinates manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <LocationContext.Provider
      value={{
        coords,
        hasCoords: hasValidCoords(coords),
        radius,
        setRadius,
        detecting,
        detectBrowserLocation,
        setManualLocation,
        clearLocation,
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
