import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';
import { RADIUS_OPTIONS, REGION_OPTIONS } from '../utils/constants';

export default function LocationSelector({ showRadius = true }) {
  const { t } = useTranslation();
  const {
    hasCoords,
    gpsStatus,
    reverseGeocodeOk,
    detecting,
    displayLabel,
    radius,
    setRadius,
    regionFilter,
    setRegionFilter,
    clearRegionFilter,
    detectBrowserLocation,
  } = useLocationContext();

  function handleRegionFallback(e) {
    const val = e.target.value;
    if (val === '') {
      clearRegionFilter();
      return;
    }
    const region = REGION_OPTIONS[Number(val)];
    if (region) {
      setRegionFilter(region);
    }
  }

  return (
    <div className="bg-white border border-earth-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
            {detecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('gps.headerLabel')}
            </div>
            {detecting ? (
              <div className="text-sm font-semibold text-forest-800">
                {t('gps.detecting')}
              </div>
            ) : hasCoords ? (
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0" />
                <span>
                  {reverseGeocodeOk
                    ? displayLabel
                    : t('gps.gpsOnlyCaptured')}
                </span>
                {!reverseGeocodeOk && (
                  <span className="text-xs font-normal text-slate-500">
                    ({t('gps.addressUnavailable')})
                  </span>
                )}
              </div>
            ) : regionFilter.district ? (
              <div className="text-sm font-semibold text-slate-800">
                {regionFilter.village}, {regionFilter.district} ({regionFilter.state}){' '}
                <span className="text-xs font-normal text-slate-500">
                  — {t('gps.approxFilterTag')}
                </span>
              </div>
            ) : (
              <div className="text-sm font-medium text-slate-600">
                {t('gps.notSet')}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={detectBrowserLocation}
            disabled={detecting}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs sm:text-sm font-bold transition-colors disabled:opacity-60"
          >
            {detecting ? (
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

          {!hasCoords && (
            <select
              aria-label={t('gps.regionFallbackSelect')}
              onChange={handleRegionFallback}
              defaultValue=""
              className="min-h-[44px] px-3 rounded-xl border border-earth-200 bg-earth-50 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value="">{t('gps.regionFallbackSelect')}</option>
              {REGION_OPTIONS.map((reg, idx) => (
                <option key={`${reg.village}-${reg.district}`} value={idx}>
                  {reg.village}, {reg.district} ({reg.state})
                </option>
              ))}
            </select>
          )}

          {showRadius && (
            <div className="min-h-[44px] flex items-center gap-1.5 bg-earth-50 border border-earth-200 rounded-xl px-3">
              <span className="text-xs font-medium text-slate-600">
                {t('gps.radiusLabel')}
              </span>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                disabled={!hasCoords}
                className="bg-transparent text-xs sm:text-sm font-semibold text-forest-800 focus:outline-none disabled:opacity-50"
              >
                {RADIUS_OPTIONS.map((km) => (
                  <option key={km} value={km}>
                    {t('gps.withinKm', { km })}
                  </option>
                ))}
                <option value={0}>{t('gps.anyDistance')}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {gpsStatus === 'denied' && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {t('gps.permissionDenied')}
          </span>
          <button
            type="button"
            onClick={detectBrowserLocation}
            className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold shrink-0"
          >
            {t('gps.retryBtn')}
          </button>
        </div>
      )}

      {gpsStatus === 'unavailable' && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <WifiOff className="w-4 h-4 shrink-0" />
            {t('gps.unavailable')}
          </span>
          <button
            type="button"
            onClick={detectBrowserLocation}
            className="px-3 py-1.5 rounded-lg bg-amber-800 text-white font-bold shrink-0"
          >
            {t('gps.retryBtn')}
          </button>
        </div>
      )}

      {gpsStatus === 'timeout' && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {t('gps.timeout')}
          </span>
          <button
            type="button"
            onClick={detectBrowserLocation}
            className="px-3 py-1.5 rounded-lg bg-amber-800 text-white font-bold shrink-0"
          >
            {t('gps.retryBtn')}
          </button>
        </div>
      )}
    </div>
  );
}
