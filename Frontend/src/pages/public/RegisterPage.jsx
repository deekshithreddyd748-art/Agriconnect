import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Sprout,
  Users,
  Tractor,
  Warehouse,
  Phone,
  ShieldCheck,
  User as UserIcon,
  MapPin,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Wheat,
  Ruler,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { PROVIDER_ROLES } from '../../utils/constants';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import CurrentLocationPicker from '../../components/location/CurrentLocationPicker';

const ROLE_CARDS = [
  {
    id: 'farmer',
    icon: Sprout,
    titleKey: 'auth.roles.farmerTitle',
    descKey: 'auth.roles.farmerDesc',
    accent: 'bg-forest-50 text-forest-700',
  },
  {
    id: 'labour_provider',
    icon: Users,
    titleKey: 'auth.roles.labourTitle',
    descKey: 'auth.roles.labourDesc',
    accent: 'bg-harvest-100 text-harvest-700',
  },
  {
    id: 'equipment_owner',
    icon: Tractor,
    titleKey: 'auth.roles.equipmentTitle',
    descKey: 'auth.roles.equipmentDesc',
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    id: 'facility_operator',
    icon: Warehouse,
    titleKey: 'auth.roles.facilityTitle',
    descKey: 'auth.roles.facilityDesc',
    accent: 'bg-sky-50 text-sky-700',
  },
];

export default function RegisterPage() {
  const { sendOtp, verifyOtp, completeOtpOnboarding } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('farmer');

  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [mockOtpHint, setMockOtpHint] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function redirectByRole(userObj) {
    if (userObj.role === 'admin') return navigate('/admin', { replace: true });
    if (PROVIDER_ROLES.includes(userObj.role)) {
      return navigate('/provider/dashboard', { replace: true });
    }
    return navigate('/farmer/dashboard', { replace: true });
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    const digits = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      toast.error(t('auth.invalidMobile'));
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendOtp(digits);
      setOtpSent(true);
      setMockOtpHint(res.demoOtpMode ? res.mockOtp : '');
      toast.success(
        res.demoOtpMode
          ? t('auth.demoOtpNotice', { otp: res.mockOtp })
          : 'OTP sent to your mobile number.'
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send OTP.'));
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const digits = mobileNumber.replace(/\D/g, '');
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error(t('auth.invalidOtp'));
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyOtp(digits, otp.trim());
      if (!res.isNewUser && res.user) {
        toast.success(`Welcome back, ${res.user.name}!`);
        redirectByRole(res.user);
        return;
      }
      setVerificationToken(res.verificationToken);
      setStep(3);
      toast.success(t('auth.verifiedBadge'));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid OTP.'));
    } finally {
      setVerifying(false);
    }
  }

  function handleGpsCaptured(loc) {
    setGpsLocation(loc);
    if (loc.village) setVillage(loc.village);
    if (loc.district) setDistrict(loc.district);
    if (loc.state) setStateName(loc.state);
  }

  function handleRegionFallback(region) {
    setVillage(region.village);
    setDistrict(region.district);
    setStateName(region.state);
  }

  async function handleCompleteProfile(e) {
    e.preventDefault();
    if (!name.trim() || !village.trim() || !district.trim()) {
      toast.error(t('auth.requiredField'));
      return;
    }

    setSubmitting(true);
    try {
      const user = await completeOtpOnboarding({
        verificationToken,
        name: name.trim(),
        role,
        village: village.trim(),
        district: district.trim(),
        state: stateName.trim(),
        primaryCrop: primaryCrop.trim(),
        farmSize: farmSize === '' ? null : Number(farmSize),
        skills,
        experience,
        language: i18n.language,
        location: {
          lat: gpsLocation?.lat ?? null,
          lng: gpsLocation?.lng ?? null,
          address:
            gpsLocation?.formattedAddress ||
            [village, district, stateName].filter(Boolean).join(', '),
        },
      });
      toast.success(`Welcome to AgriConnect, ${user.name}!`);
      redirectByRole(user);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
            {t('auth.stepProgress', { step })}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
            {t('auth.onboardingTitle')}
          </h1>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Progress Bar */}
      <div className="grid grid-cols-3 gap-2 mb-6" aria-label="Registration progress">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2.5 rounded-full transition-colors ${
              s <= step ? 'bg-forest-700' : 'bg-earth-200'
            }`}
          />
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm">
        {/* STEP 1: SELECT USER ROLE */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-forest-900">
                {t('auth.step1Title')}
              </h2>
              <p className="text-sm text-slate-600 mt-1">{t('auth.step1Subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROLE_CARDS.map((card) => {
                const Icon = card.icon;
                const selected = role === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setRole(card.id)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all min-h-[120px] flex flex-col justify-between gap-3 ${
                      selected
                        ? 'border-forest-700 bg-forest-50/70 shadow-sm'
                        : 'border-earth-200 bg-white hover:border-forest-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.accent}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-6 h-6 text-forest-700" />
                      )}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {t(card.titleKey)}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        {t(card.descKey)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base transition-colors"
            >
              {t('auth.continue')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: MOBILE NUMBER OTP VERIFICATION */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-forest-900">
                {t('auth.step2Title')}
              </h2>
              <p className="text-sm text-slate-600 mt-1">{t('auth.step2Subtitle')}</p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    <Phone className="w-4 h-4 text-forest-700" />
                    {t('auth.mobileLabel')} *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-4 min-h-[52px] inline-flex items-center rounded-xl bg-earth-100 border border-earth-200 font-bold text-slate-700">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder={t('auth.mobilePlaceholder')}
                      className="flex-1 min-h-[52px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-lg font-semibold tracking-wide"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 min-h-[50px] inline-flex items-center gap-1.5 rounded-xl border border-earth-200 font-semibold text-sm text-slate-700 hover:bg-earth-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('auth.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOtp}
                    className="flex-1 min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base disabled:opacity-60"
                  >
                    {sendingOtp ? t('auth.sendingOtp') : t('auth.sendOtp')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {mockOtpHint && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 font-semibold">
                    {t('auth.demoOtpNotice', { otp: mockOtpHint })}
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    <ShieldCheck className="w-4 h-4 text-forest-700" />
                    {t('auth.otpLabel')} (+91 {mobileNumber}) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('auth.otpPlaceholder')}
                    className="w-full min-h-[54px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-center text-2xl font-extrabold tracking-[0.4em]"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setMockOtpHint('');
                    }}
                    className="px-4 min-h-[48px] rounded-xl border border-earth-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-earth-50"
                  >
                    {t('auth.resendOtp')}
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="flex-1 min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base disabled:opacity-60"
                  >
                    {verifying ? t('auth.verifyingOtp') : t('auth.verifyOtp')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* STEP 3: MINIMAL PROFILE SETUP WITH ONE-TAP GPS */}
        {step === 3 && (
          <form onSubmit={handleCompleteProfile} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-forest-900">
                  {t('auth.step3Title')}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">{t('auth.step3Subtitle')}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                +91 {mobileNumber} · {t('auth.verifiedBadge')}
              </span>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                <UserIcon className="w-4 h-4 text-forest-700" />
                {t('auth.fullName')} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.fullNamePlaceholder')}
                className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-base"
              />
            </div>

            <CurrentLocationPicker
              title="Pin Your Current GPS Location"
              onLocationCaptured={handleGpsCaptured}
              onRegionFallbackChange={handleRegionFallback}
              showMapPreview
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <MapPin className="w-4 h-4 text-forest-700" />
                  {t('auth.village')} *
                </label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder={t('auth.villagePlaceholder')}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-base"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <MapPin className="w-4 h-4 text-forest-700" />
                  {t('auth.district')} *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={t('auth.districtPlaceholder')}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-base"
                />
              </div>
            </div>

            {role === 'farmer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Wheat className="w-4 h-4 text-forest-700" />
                    {t('auth.primaryCrop')}
                  </label>
                  <input
                    type="text"
                    value={primaryCrop}
                    onChange={(e) => setPrimaryCrop(e.target.value)}
                    placeholder={t('auth.primaryCropPlaceholder')}
                    className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-base"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Ruler className="w-4 h-4 text-forest-700" />
                    {t('auth.farmSize')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder={t('auth.farmSizePlaceholder')}
                    className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-base"
                  />
                </div>
              </div>
            )}

            {role === 'labour_provider' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t('auth.skillsLabel')}
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Harvesting, Sowing, Weeding"
                    className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t('auth.experienceLabel')}
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g., 5 years farm work"
                    className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-base"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 min-h-[50px] inline-flex items-center gap-1.5 rounded-xl border border-earth-200 font-semibold text-sm text-slate-700 hover:bg-earth-50"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.back')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base disabled:opacity-60"
              >
                {submitting ? t('auth.saving') : t('auth.finishSignup')}
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 pt-5 border-t border-earth-200 text-sm text-center text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="text-forest-700 font-bold hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
