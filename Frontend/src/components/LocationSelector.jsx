import { useState } from 'react';
import { Crosshair, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';
import { PRESET_LOCATIONS, RADIUS_OPTIONS } from '../utils/constants';

export default function LocationSelector({ showRadius = true }) {
  const {
    coords,
    hasCoords,
    radius,
    setRadius,
    detecting,
    detectBrowserLocation,
    setManualLocation,
    clearLocation,
  } = useLocationContext();

  const [manualOpen, setManualOpen] = useState(false);
  const [latInput, setLatInput] = useState(coords?.lat ?? '');
  const [lngInput, setLngInput] = useState(coords?.lng ?? '');
  const [labelInput, setLabelInput] = useState(coords?.label ?? '');

  function handlePresetChange(e) {
    const idx = e.target.value;
    if (idx === '') return;
    if (idx === 'clear') {
      clearLocation();
      return;
    }
    const preset = PRESET_LOCATIONS[Number(idx)];
    if (preset) {
      setManualLocation({
        lat: preset.lat,
        lng: preset.lng,
        label: preset.label,
      });
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    setManualLocation({
      lat: latInput,
      lng: lngInput,
      label: labelInput || 'Custom Farm Location',
    });
    setManualOpen(false);
  }

  return (
    <div className="bg-white border border-earth-200 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hyperlocal Discovery Center
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {hasCoords
                ? `${coords.label} (${Number(coords.lat).toFixed(3)}, ${Number(coords.lng).toFixed(3)})`
                : 'No coordinates selected — distances unavailable'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={detectBrowserLocation}
            disabled={detecting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <Crosshair className="w-4 h-4" />
            {detecting ? 'Detecting...' : 'Use My GPS'}
          </button>

          <select
            aria-label="Select agricultural region preset"
            onChange={handlePresetChange}
            defaultValue=""
            className="px-3 py-2 rounded-xl border border-earth-200 bg-earth-50 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            <option value="" disabled>
              Choose Town / Village...
            </option>
            {PRESET_LOCATIONS.map((loc, idx) => (
              <option key={loc.label} value={idx}>
                {loc.label}
              </option>
            ))}
            <option value="clear">Clear Coordinates (Show All)</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setLatInput(coords?.lat ?? '');
              setLngInput(coords?.lng ?? '');
              setLabelInput(coords?.label ?? '');
              setManualOpen((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-earth-200 hover:bg-earth-50 text-xs sm:text-sm font-medium text-slate-700"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Manual Coordinates
          </button>

          {showRadius && (
            <div className="flex items-center gap-1.5 bg-earth-50 border border-earth-200 rounded-xl px-2.5 py-1.5">
              <span className="text-xs font-medium text-slate-600">Radius:</span>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="bg-transparent text-xs sm:text-sm font-semibold text-forest-800 focus:outline-none"
              >
                {RADIUS_OPTIONS.map((km) => (
                  <option key={km} value={km}>
                    Within {km} km
                  </option>
                ))}
                <option value={0}>Any distance</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {manualOpen && (
        <form
          onSubmit={handleManualSubmit}
          className="mt-4 pt-4 border-t border-earth-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Village / Location Label
            </label>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="e.g., Baramati Farm"
              className="w-full px-3 py-2 rounded-xl border border-earth-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              required
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="18.1517"
              className="w-full px-3 py-2 rounded-xl border border-earth-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              required
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="74.5777"
              className="w-full px-3 py-2 rounded-xl border border-earth-200 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setManualOpen(false)}
              className="p-2 rounded-xl border border-earth-200 text-slate-600 hover:bg-earth-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
