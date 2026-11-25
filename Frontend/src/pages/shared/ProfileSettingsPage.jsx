import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Crosshair, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { LANGUAGES, PRESET_LOCATIONS, ROLE_LABELS } from '../../utils/constants';
import { LocationPickerMap } from '../../components/ServiceMap';

export default function ProfileSettingsPage() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [language, setLanguage] = useState(user?.language || 'English');
  const [village, setVillage] = useState(user?.village || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [stateName, setStateName] = useState(user?.state || '');
  const [address, setAddress] = useState(user?.location?.address || '');
  const [lat, setLat] = useState(user?.location?.lat ?? 18.1517);
  const [lng, setLng] = useState(user?.location?.lng ?? 74.5777);

  function detectGps() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(5)));
        setLng(Number(pos.coords.longitude.toFixed(5)));
        toast.success('GPS coordinates updated.');
      },
      () => toast.error('Location permission denied.')
    );
  }

  function applyPreset(e) {
    const idx = e.target.value;
    if (idx === '') return;
    const p = PRESET_LOCATIONS[Number(idx)];
    if (!p) return;
    setVillage(p.village);
    setDistrict(p.district);
    setStateName(p.state);
    setLat(p.lat);
    setLng(p.lng);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        phone,
        language,
        village,
        district,
        state: stateName,
        location: {
          lat: lat === '' ? null : Number(lat),
          lng: lng === '' ? null : Number(lng),
          address,
        },
      });
      toast.success('Profile settings updated.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-earth-200">
          <div className="w-11 h-11 rounded-2xl bg-forest-700 text-white flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-forest-900">Profile Settings</h1>
            <p className="text-xs text-slate-500">
              {user?.email} · Role: {ROLE_LABELS[user?.role]}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm bg-white"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Village
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-earth-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Saved Coordinates ({lat || '—'}, {lng || '—'})
              </span>
              <div className="flex gap-2">
                <select
                  onChange={applyPreset}
                  defaultValue=""
                  className="px-2.5 py-1.5 rounded-lg border border-earth-200 text-xs bg-earth-50"
                >
                  <option value="" disabled>
                    Pick Preset Town...
                  </option>
                  {PRESET_LOCATIONS.map((p, idx) => (
                    <option key={p.label} value={idx}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={detectGps}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-forest-50 text-forest-700 text-xs font-semibold"
                >
                  <Crosshair className="w-3.5 h-3.5" /> GPS
                </button>
              </div>
            </div>
            <LocationPickerMap
              lat={lat}
              lng={lng}
              onSelect={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
              height="220px"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
