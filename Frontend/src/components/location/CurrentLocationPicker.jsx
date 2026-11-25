import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Loader2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { REGION_OPTIONS } from '../../utils/constants';
import { ReadOnlyLocationMap } from '../ServiceMap';

/**
 * Reusable GPS-only location capture component.
 * Never displays manual latitude/longitude inputs or editable map pins.
 */
export default function CurrentLocationPicker({
  initialLocation = null,
  onLocationCaptured,
  onRegionFallbackChange,
  showMapPreview = false,
  compact = false,
  title,
}) {
  const { t } = useTranslation();
  const {
    status,
    location,
    hasCoords,
    reverseGeocodeOk,
    isDetecting,
    captureLocation,
    syncSavedLocation,
  } = useCurrentLocation(initialLocation);

  useEffect(() => {
    if (initialLocation?.lat !== undefined && initialLocation?.lng !== undefined) {
      syncSavedLocation(initialLocation);
    }
  }, [initialLocation?.lat, initialLocation?.lng, syncSavedLocation]);

  async function handleTapGps() {
    const captured = await captureLocation();
    if (captured && onLocationCaptured) {
      onLocationCaptured(captured);
    }
  }

  function handleRegionSelect(e) {
    const idx = e.target.value;
    if (idx === '') return;
    const region = REGION_OPTIONS[Number(idx)];
    if (region && onRegionFallbackChange) {
      onRegionFallbackChange(region);
    }
  }

  return (
    <div className="rounded-2xl border border-earth-200 bg-earth-50 p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-forest-700 text-white flex items-center justify-center shrink-0">
            {isDetecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
          </div>
          <div>
            {title && (
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {title}
              </div>
            )}

            {status === 'idle' && (
              <div className="text-sm font-semibold text-slate-800">
                {t('gps.notSet')}
              </div>
            )}

            {status === 'detecting' && (
              <div className="text-sm font-semibold text-forest-800">
                {t('gps.detecting')}
              </div>
            )}

            {status === 'captured' && hasCoords && (
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-800">
                  <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0" />
                  {reverseGeocodeOk ? t('gps.capturedSuccess') : t('gps.gpsOnlyCaptured')}
                </div>
                {reverseGeocodeOk ? (
                  <div className="text-xs sm:text-sm text-slate-700">
                    {[location?.village, location?.district, location?.state]
                      .filter(Boolean)
                      .join(', ') || location?.formattedAddress}
                  </div>
                ) : (
                  <div className="text-xs text-slate-600">
                    {t('gps.addressUnavailable')}
                  </div>
                )}
                {!compact && location?.formattedAddress && reverseGeocodeOk && (
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {location.formattedAddress}
                  </div>
                )}
              </div>
            )}

            {status === 'denied' && (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-800">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {t('gps.permissionDenied')}
                </div>
                {hasCoords && (
                  <div className="text-xs text-slate-600">
                    {t('gps.preservedPrevious', {
                      place:
                        [location?.village, location?.district].filter(Boolean).join(', ') ||
                        t('gps.gpsOnlyCaptured'),
                    })}
                  </div>
                )}
              </div>
            )}

            {status === 'unavailable' && (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-900">
                  <WifiOff className="w-4 h-4 shrink-0" />
                  {t('gps.unavailable')}
                </div>
                {hasCoords && (
                  <div className="text-xs text-slate-600">
                    {t('gps.preservedPrevious', {
                      place:
                        [location?.village, location?.district].filter(Boolean).join(', ') ||
                        t('gps.gpsOnlyCaptured'),
                    })}
                  </div>
                )}
              </div>
            )}

            {status === 'timeout' && (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {t('gps.timeout')}
                </div>
                {hasCoords && (
                  <div className="text-xs text-slate-600">
                    {t('gps.preservedPrevious', {
                      place:
                        [location?.village, location?.district].filter(Boolean).join(', ') ||
                        t('gps.gpsOnlyCaptured'),
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleTapGps}
          disabled={isDetecting}
          className="min-h-[48px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-bold shadow-sm transition-colors disabled:opacity-60 shrink-0"
        >
          {isDetecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('gps.detectingShort')}
            </>
          ) : hasCoords ? (
            <>
              <RefreshCw className="w-4 h-4" />
              {t('gps.refreshBtn')}
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              {t('gps.useCurrentBtn')}
            </>
          )}
        </button>
      </div>

      {/* Safe Non-Coordinate Region Fallback when GPS is denied/unavailable/timeout */}
      {['denied', 'unavailable', 'timeout'].includes(status) && onRegionFallbackChange && (
        <div className="pt-2 border-t border-earth-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs text-slate-600">{t('gps.regionFallbackHint')}</span>
          <select
            aria-label={t('gps.regionFallbackSelect')}
            defaultValue=""
            onChange={handleRegionSelect}
            className="min-h-[44px] px-3 rounded-xl border border-earth-200 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="" disabled>
              {t('gps.regionFallbackSelect')}
            </option>
            {REGION_OPTIONS.map((reg, idx) => (
              <option key={`${reg.village}-${reg.district}`} value={idx}>
                {reg.village}, {reg.district} ({reg.state})
              </option>
            ))}
          </select>
        </div>
      )}

      {showMapPreview && hasCoords && (
        <div className="pt-1">
          <ReadOnlyLocationMap
            lat={location.lat}
            lng={location.lng}
            label={[location.village, location.district].filter(Boolean).join(', ')}
            height="190px"
          />
        </div>
      )}
    </div>
  );
}
