import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { LANGUAGES, ROLE_LABELS } from '../../utils/constants';
import CurrentLocationPicker from '../../components/location/CurrentLocationPicker';

export default function ProfileSettingsPage() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [language, setLanguage] = useState(user?.language || 'English');
  const [village, setVillage] = useState(user?.village || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [stateName, setStateName] = useState(user?.state || '');
  const [primaryCrop, setPrimaryCrop] = useState(user?.primaryCrop || '');
  const [farmSize, setFarmSize] = useState(user?.farmSize ?? '');
  const [skills, setSkills] = useState((user?.skills || []).join(', '));
  const [experience, setExperience] = useState(user?.experience || '');
  const [availability, setAvailability] = useState(user?.availability ?? true);
  const [address, setAddress] = useState(user?.location?.address || '');
  const [gpsCoords, setGpsCoords] = useState(
    user?.location?.lat !== null && user?.location?.lng !== null
      ? { lat: user?.location?.lat, lng: user?.location?.lng }
      : null
  );

  function handleGpsCaptured(loc) {
    setGpsCoords({ lat: loc.lat, lng: loc.lng });
    if (loc.village) setVillage(loc.village);
    if (loc.district) setDistrict(loc.district);
    if (loc.state) setStateName(loc.state);
    if (loc.formattedAddress) setAddress(loc.formattedAddress);
  }

  function handleRegionFallback(region) {
    setVillage(region.village);
    setDistrict(region.district);
    setStateName(region.state);
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
        primaryCrop,
        farmSize: farmSize === '' ? null : Number(farmSize),
        skills,
        experience,
        availability,
        location: {
          lat: gpsCoords?.lat ?? null,
          lng: gpsCoords?.lng ?? null,
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
              {user?.email || user?.phone} · Role: {ROLE_LABELS[user?.role]}
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
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
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
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm bg-white"
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
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>

            {user?.role === 'farmer' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Crop
                  </label>
                  <input
                    type="text"
                    value={primaryCrop}
                    onChange={(e) => setPrimaryCrop(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Farm Size (Acres)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>
              </>
            )}

            {user?.role === 'labour_provider' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={availability}
                    onChange={(e) => setAvailability(e.target.checked)}
                    className="rounded border-earth-200 text-forest-700"
                  />
                  Currently available for farm work requests
                </label>
              </>
            )}
          </div>

          <CurrentLocationPicker
            title="Saved GPS Location"
            initialLocation={{
              lat: gpsCoords?.lat,
              lng: gpsCoords?.lng,
              village,
              district,
              state: stateName,
              address,
            }}
            onLocationCaptured={handleGpsCaptured}
            onRegionFallbackChange={handleRegionFallback}
            showMapPreview
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Village
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
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
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
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
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="min-h-[48px] inline-flex items-center gap-2 px-6 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
