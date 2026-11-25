import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Save, User as UserIcon, CheckCircle2, Languages } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { SUPPORTED_LANGUAGES, setAppLanguage } from '../../i18n';
import CurrentLocationPicker from '../../components/location/CurrentLocationPicker';

export default function ProfileSettingsPage() {
  const { user, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [language, setLanguage] = useState(user?.language || i18n.language || 'en');
  const [village, setVillage] = useState(user?.village || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [stateName, setStateName] = useState(user?.state || '');
  const [primaryCrop, setPrimaryCrop] = useState(user?.primaryCrop || '');
  const [farmSize, setFarmSize] = useState(user?.farmSize ?? '');
  const [farmSizeUnit, setFarmSizeUnit] = useState(user?.farmSizeUnit || 'acres');
  const [skills, setSkills] = useState((user?.skills || []).join(', '));
  const [experience, setExperience] = useState(user?.experience || '');
  const [availability, setAvailability] = useState(user?.availability ?? true);
  const [address, setAddress] = useState(user?.location?.address || '');
  const [gpsCoords, setGpsCoords] = useState(
    user?.location?.lat !== null && user?.location?.lng !== null
      ? { lat: user?.location?.lat, lng: user?.location?.lng }
      : null
  );

  function handleLanguageSelect(code) {
    setLanguage(code);
    setAppLanguage(code);
  }

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
        farmSizeUnit,
        skills,
        experience,
        availability,
        location: {
          lat: gpsCoords?.lat ?? null,
          lng: gpsCoords?.lng ?? null,
          address,
        },
      });
      toast.success(t('profile.profileUpdated'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-earth-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-forest-700 text-white flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-forest-900">{t('profile.title')}</h1>
              <p className="text-xs text-slate-500">
                {user?.email || user?.phone} · {t(`roles.${user?.role}`, user?.role)}
              </p>
            </div>
          </div>

          {user?.mobileVerified && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('auth.verifiedBadge')}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* App Language Picker */}
          <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-800">
              <Languages className="w-4 h-4" />
              {t('profile.languageSection')}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const active = i18n.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`min-h-[44px] px-2 rounded-xl border text-xs font-bold transition-colors ${
                      active
                        ? 'bg-forest-700 text-white border-forest-700'
                        : 'bg-white text-slate-700 border-earth-200 hover:border-forest-400'
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.fullName')}
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
                {t('auth.mobileLabel')}
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.address')}
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
                    {t('auth.primaryCrop')}
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
                    {t('auth.farmSize')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                    />
                    <select
                      aria-label={t('auth.farmSizeUnit')}
                      value={farmSizeUnit}
                      onChange={(e) => setFarmSizeUnit(e.target.value)}
                      className="min-h-[44px] px-3 rounded-xl border border-earth-200 bg-white text-xs font-semibold"
                    >
                      <option value="acres">{t('auth.acres')}</option>
                      <option value="hectares">{t('auth.hectares')}</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {user?.role === 'labour_provider' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('auth.skillsLabel')}
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
                    {t('auth.experienceLabel')}
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
                  {t('common.available')}
                </label>
              </>
            )}
          </div>

          <CurrentLocationPicker
            title={t('profile.farmGpsTitle')}
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
                {t('auth.village')}
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
                {t('auth.district')}
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
                {t('auth.state')}
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
            {saving ? t('profile.savingProfile') : t('profile.saveProfileBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
