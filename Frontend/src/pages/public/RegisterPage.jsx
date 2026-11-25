import { useEffect, useState } from 'react';
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
  Languages,
  AlertTriangle,
  PlayCircle,
  Clock,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { PROVIDER_ROLES } from '../../utils/constants';
import { SUPPORTED_LANGUAGES, setAppLanguage } from '../../i18n';
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

const STEP_KEYS = ['language', 'mobile', 'requestOtp', 'verifyOtp', 'profile', 'dashboard'];

export default function RegisterPage() {
  const { getOtpStatus, sendOtp, verifyOtp, completeOtpOnboarding } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Steps: 1 Language & Role -> 2 Mobile -> 3 Request OTP -> 4 Verify OTP -> 5 Basic Profile -> 6 Dashboard
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('farmer');

  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [smsNotConfigured, setSmsNotConfigured] = useState(false);
  const [otpSentInfo, setOtpSentInfo] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [farmSizeUnit, setFarmSizeUnit] = useState('acres');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [createdUser, setCreatedUser] = useState(null);

  useEffect(() => {
    getOtpStatus()
      .then((info) => {
        if (info && info.configured === false) {
          setSmsNotConfigured(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const id = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownSeconds]);

  function redirectByRole(userObj) {
    if (userObj.role === 'admin') return navigate('/admin', { replace: true });
    if (PROVIDER_ROLES.includes(userObj.role)) {
      return navigate('/provider/dashboard', { replace: true });
    }
    return navigate('/farmer/dashboard', { replace: true });
  }

  function handleLanguagePick(code) {
    setAppLanguage(code);
  }

  function handleMobileContinue(e) {
    e.preventDefault();
    const digits = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      toast.error(t('auth.invalidMobile'));
      return;
    }
    setMobileNumber(digits);
    setStep(3);
  }

  async function handleSendOtp() {
    const digits = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      toast.error(t('auth.invalidMobile'));
      setStep(2);
      return;
    }

    setSendingOtp(true);
    setSmsNotConfigured(false);
    try {
      const res = await sendOtp(digits);
      setOtpSentInfo(true);
      setCooldownSeconds(res.cooldownSeconds || 60);
      toast.success(t('auth.otpSentBanner', { mobile: digits }));
      setStep(4);
    } catch (err) {
      const code = err?.response?.data?.code;
      const retryAfter = err?.response?.data?.retryAfterSeconds;
      if (code === 'SMS_NOT_CONFIGURED') {
        setSmsNotConfigured(true);
        toast.error(t('auth.smsPendingTitle'));
      } else if (code === 'OTP_COOLDOWN' && retryAfter) {
        setCooldownSeconds(retryAfter);
        setOtpSentInfo(true);
        setStep(4);
        toast.error(t('auth.resendCountdown', { seconds: retryAfter }));
      } else {
        toast.error(getErrorMessage(err, t('auth.otpFailed')));
      }
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
        toast.success(t('auth.welcomeBack', { name: res.user.name }));
        redirectByRole(res.user);
        return;
      }
      setVerificationToken(res.verificationToken);
      setStep(5);
    } catch (err) {
      toast.error(getErrorMessage(err, t('auth.otpVerifyFailed')));
    } finally {
      setVerifying(false);
    }
  }

  function handleGpsCaptured(loc) {
    setGpsLocation({ lat: loc.lat, lng: loc.lng, address: loc.formattedAddress || '' });
    if (loc.village) setVillage(loc.village);
    if (loc.district) setDistrict(loc.district);
    if (loc.state) setStateName(loc.state);
  }

  function handleRegionFallback(region) {
    setVillage(region.village);
    setDistrict(region.district);
    setStateName(region.state);
  }

  async function handleCompleteSignup(e) {
    e.preventDefault();
    if (!name.trim() || !village.trim() || !district.trim()) {
      toast.error(t('auth.requiredField'));
      return;
    }

    setSubmitting(true);
    try {
      const savedUser = await completeOtpOnboarding({
        verificationToken,
        name: name.trim(),
        role,
        village: village.trim(),
        district: district.trim(),
        state: stateName.trim(),
        primaryCrop: primaryCrop.trim(),
        farmSize: farmSize ? Number(farmSize) : undefined,
        farmSizeUnit,
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experience: experience.trim(),
        language: i18n.language || 'en',
        location: {
          lat: gpsLocation?.lat ?? null,
          lng: gpsLocation?.lng ?? null,
          address: gpsLocation?.address || `${village.trim()}, ${district.trim()}`,
        },
      });
      setCreatedUser(savedUser);
      setStep(6);
      toast.success(t('auth.welcomeBack', { name: savedUser.name }));
      setTimeout(() => redirectByRole(savedUser), 1400);
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm">
        {/* Top bar & 6-Step Progress */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-forest-700 text-white flex items-center justify-center shrink-0">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-forest-900">
                {t('auth.onboardingTitle')}
              </h1>
              <p className="text-xs text-slate-500">
                {t('auth.stepProgress', { step, total: 6 })} · {t('auth.onboardingSubtitle')}
              </p>
            </div>
          </div>

          <Link
            to="/labour-demo"
            className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl bg-harvest-100 text-harvest-700 hover:bg-harvest-200 text-xs font-bold transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            {t('landing.tryLabourDemo')}
          </Link>
        </div>

        {/* 6-Step Progress Bar & Labels */}
        <div className="mb-7 space-y-2">
          <div className="grid grid-cols-6 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className={`h-2.5 rounded-full transition-colors ${
                  step >= n ? 'bg-forest-700' : 'bg-earth-200'
                }`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[11px] font-semibold">
            {STEP_KEYS.map((key, idx) => {
              const sNum = idx + 1;
              return (
                <div
                  key={key}
                  className={`truncate ${
                    step === sNum
                      ? 'text-forest-800 font-bold'
                      : step > sNum
                        ? 'text-fresh-600'
                        : 'text-slate-400'
                  }`}
                >
                  {t(`auth.steps.${key}`)}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1: Select Language + Account Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Languages className="w-5 h-5 text-forest-700" />
                {t('auth.step1LangTitle')}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">{t('auth.step1LangSubtitle')}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const active = i18n.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguagePick(lang.code)}
                    className={`min-h-[56px] px-4 py-3 rounded-2xl border-2 text-center font-bold transition-all ${
                      active
                        ? 'border-forest-700 bg-forest-50 text-forest-900 shadow-sm'
                        : 'border-earth-200 bg-white text-slate-700 hover:border-forest-400'
                    }`}
                  >
                    <div className="text-base">{lang.nativeName}</div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5 pt-2 border-t border-earth-200">
              <div className="text-sm font-bold text-slate-800">{t('auth.accountTypeLabel')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLE_CARDS.map((card) => {
                  const Icon = card.icon;
                  const active = role === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setRole(card.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                        active
                          ? 'border-forest-700 bg-forest-50/70 shadow-sm'
                          : 'border-earth-200 hover:border-forest-400'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.accent}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{t(card.titleKey)}</div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {t(card.descKey)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base shadow-sm"
            >
              {t('auth.continue')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: Enter Mobile Number */}
        {step === 2 && (
          <form onSubmit={handleMobileContinue} className="space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t('auth.step2Title')}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">{t('auth.step2Subtitle')}</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
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
                  className="flex-1 min-h-[52px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-lg font-bold tracking-wider"
                />
              </div>
            </div>

            <div className="flex gap-3">
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
                className="flex-1 min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base"
              >
                {t('auth.continue')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Request OTP */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t('auth.step3SendTitle')}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">{t('auth.step3SendSubtitle')}</p>
            </div>

            <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">{t('auth.mobileLabel')}</div>
                  <div className="text-lg font-extrabold text-slate-900">+91 {mobileNumber}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 px-3 min-h-[40px] rounded-xl border border-earth-200 bg-white text-xs font-bold text-forest-700 hover:bg-earth-100"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {t('auth.editMobile')}
              </button>
            </div>

            {smsNotConfigured && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-start gap-2.5 text-amber-900">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm">{t('auth.smsPendingTitle')}</div>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      {t('auth.smsPendingDesc')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 min-h-[40px] inline-flex items-center rounded-xl bg-forest-700 text-white text-xs font-bold hover:bg-forest-800"
                  >
                    {t('auth.useEmailLogin')}
                  </Link>
                  <Link
                    to="/labour-demo"
                    className="px-3.5 min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {t('auth.tryDemoInstead')}
                  </Link>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 min-h-[50px] inline-flex items-center gap-1.5 rounded-xl border border-earth-200 font-semibold text-sm text-slate-700 hover:bg-earth-50"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.back')}
              </button>
              <button
                type="button"
                disabled={sendingOtp}
                onClick={handleSendOtp}
                className="flex-1 min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base disabled:opacity-60"
              >
                {sendingOtp ? t('auth.sendingOtp') : t('auth.sendOtp')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Verify OTP */}
        {step === 4 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t('auth.step4VerifyTitle')}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {t('auth.step4VerifySubtitle', { mobile: mobileNumber })}
              </p>
            </div>

            {otpSentInfo && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 font-semibold">
                {t('auth.otpSentBanner', { mobile: mobileNumber })}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-forest-700" />
                {t('auth.otpLabel')}
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

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtp('');
                  setStep(2);
                }}
                className="inline-flex items-center gap-1 text-forest-700 font-bold hover:underline"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {t('auth.editMobile')}
              </button>

              <button
                type="button"
                disabled={cooldownSeconds > 0 || sendingOtp}
                onClick={handleSendOtp}
                className="inline-flex items-center gap-1.5 font-bold text-forest-700 disabled:text-slate-400 hover:underline disabled:no-underline"
              >
                <Clock className="w-3.5 h-3.5" />
                {cooldownSeconds > 0
                  ? t('auth.resendCountdown', { seconds: cooldownSeconds })
                  : t('auth.resendOtp')}
              </button>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base disabled:opacity-60"
            >
              {verifying ? t('auth.verifyingOtp') : t('auth.verifyOtp')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* STEP 5: Minimal Farmer / Provider Profile -> STEP 6 Dashboard */}
        {step === 5 && (
          <form onSubmit={handleCompleteSignup} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {t('auth.step5ProfileTitle')}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {t('auth.step5ProfileSubtitle')}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('auth.verifiedBadge')} (+91 {mobileNumber})
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
              title={t('auth.locationCaptureTitle')}
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
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      placeholder={t('auth.farmSizePlaceholder')}
                      className="flex-1 min-h-[48px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-base"
                    />
                    <select
                      aria-label={t('auth.farmSizeUnit')}
                      value={farmSizeUnit}
                      onChange={(e) => setFarmSizeUnit(e.target.value)}
                      className="min-h-[48px] px-3 rounded-xl border-2 border-earth-200 bg-white text-sm font-semibold"
                    >
                      <option value="acres">{t('auth.acres')}</option>
                      <option value="hectares">{t('auth.hectares')}</option>
                    </select>
                  </div>
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
                    placeholder={t('auth.skillsPlaceholder')}
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
                    placeholder={t('auth.experiencePlaceholder')}
                    className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 focus:border-forest-700 focus:outline-none text-base"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base disabled:opacity-60"
            >
              {submitting ? t('auth.saving') : t('auth.finishSignup')}
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* STEP 6: Registration Successful -> Farmer Dashboard */}
        {step === 6 && createdUser && (
          <div className="py-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-forest-900">
                {t('auth.regSuccessTitle')}
              </h2>
              <p className="text-sm text-slate-600">
                {t('auth.welcomeBack', { name: createdUser.name })} ·{' '}
                {[createdUser.village, createdUser.district].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-slate-500">{t('auth.regSuccessDesc')}</p>
            </div>
            <button
              type="button"
              onClick={() => redirectByRole(createdUser)}
              className="min-h-[50px] px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base"
            >
              {t('auth.finishSignup')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <p className="mt-6 pt-5 border-t border-earth-200 text-sm text-center text-slate-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-forest-700 font-bold hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
