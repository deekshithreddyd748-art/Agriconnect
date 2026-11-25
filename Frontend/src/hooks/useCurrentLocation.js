import { useCallback, useEffect, useRef, useState } from 'react';
import { isValidCoordinates, reverseGeocode } from '../services/locationService';

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 30000,
};

/**
 * Reusable GPS acquisition hook with concurrency lock, unmount safety,
 * request-ID cancellation, reverse-geocoding fallback, and error recovery.
 */
export function useCurrentLocation(initialLocation = null) {
  const initialHasCoords = isValidCoordinates(initialLocation?.lat, initialLocation?.lng);

  const [status, setStatus] = useState(initialHasCoords ? 'captured' : 'idle');
  const [location, setLocation] = useState(
    initialHasCoords
      ? {
          lat: Number(initialLocation.lat),
          lng: Number(initialLocation.lng),
          village: initialLocation.village || '',
          district: initialLocation.district || '',
          state: initialLocation.state || '',
          formattedAddress: initialLocation.address || initialLocation.formattedAddress || '',
          isGpsVerified: true,
        }
      : null
  );
  const [reverseGeocodeOk, setReverseGeocodeOk] = useState(
    Boolean(
      initialHasCoords &&
        (initialLocation?.village || initialLocation?.address || initialLocation?.formattedAddress)
    )
  );
  const [errorCode, setErrorCode] = useState(null);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const captureLocation = useCallback(async () => {
    if (inFlightRef.current) return null;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (mountedRef.current) {
        setStatus('unavailable');
        setErrorCode('UNSUPPORTED');
      }
      return null;
    }

    inFlightRef.current = true;
    const reqId = ++requestIdRef.current;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    if (mountedRef.current) {
      setStatus('detecting');
      setErrorCode(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = Number(position.coords.latitude.toFixed(6));
          const lng = Number(position.coords.longitude.toFixed(6));

          if (!isValidCoordinates(lat, lng)) {
            inFlightRef.current = false;
            if (mountedRef.current && requestIdRef.current === reqId) {
              setStatus('unavailable');
              setErrorCode('INVALID_COORDS');
            }
            resolve(null);
            return;
          }

          const geoResult = await reverseGeocode(lat, lng, controller.signal);

          inFlightRef.current = false;
          if (!mountedRef.current || requestIdRef.current !== reqId) {
            resolve(null);
            return;
          }

          const nextLoc = {
            lat,
            lng,
            village: geoResult.village || '',
            district: geoResult.district || '',
            state: geoResult.state || '',
            formattedAddress: geoResult.formattedAddress || '',
            isGpsVerified: true,
          };

          setLocation(nextLoc);
          setReverseGeocodeOk(Boolean(geoResult.ok && (geoResult.formattedAddress || geoResult.village)));
          setStatus('captured');
          setErrorCode(null);
          resolve(nextLoc);
        },
        (err) => {
          inFlightRef.current = false;
          if (!mountedRef.current || requestIdRef.current !== reqId) {
            resolve(null);
            return;
          }

          if (err?.code === 1) {
            setStatus('denied');
            setErrorCode('PERMISSION_DENIED');
          } else if (err?.code === 3) {
            setStatus('timeout');
            setErrorCode('TIMEOUT');
          } else {
            setStatus('unavailable');
            setErrorCode('POSITION_UNAVAILABLE');
          }
          resolve(null);
        },
        GEOLOCATION_OPTIONS
      );
    });
  }, []);

  const syncSavedLocation = useCallback((savedLoc) => {
    if (!isValidCoordinates(savedLoc?.lat, savedLoc?.lng)) return;
    setLocation({
      lat: Number(savedLoc.lat),
      lng: Number(savedLoc.lng),
      village: savedLoc.village || '',
      district: savedLoc.district || '',
      state: savedLoc.state || '',
      formattedAddress: savedLoc.address || savedLoc.formattedAddress || '',
      isGpsVerified: true,
    });
    setReverseGeocodeOk(Boolean(savedLoc.village || savedLoc.address || savedLoc.formattedAddress));
    setStatus('captured');
    setErrorCode(null);
  }, []);

  return {
    status,
    location,
    hasCoords: isValidCoordinates(location?.lat, location?.lng),
    reverseGeocodeOk,
    errorCode,
    isDetecting: status === 'detecting',
    captureLocation,
    syncSavedLocation,
  };
}
