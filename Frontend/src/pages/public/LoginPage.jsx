import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Sprout,
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Volume2,
  VolumeX,
  PlayCircle,
  Loader2,
  Compass,
  Sparkles,
} from 'lucide-react';
import { DEMO_ACCOUNT_CREDENTIALS, useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { PROVIDER_ROLES } from '../../utils/constants';
import { useVoiceAssist } from '../../hooks/useVoiceAssist';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function LoginPage() {
  const { user, enterGuestMode, loginDemoUser, continueProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { supported: voiceSupported, voiceEnabled, setVoiceEnabled, speak, stop } =
    useVoiceAssist();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'demo_account'

  // Mobile profile fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [conflictData, setConflictData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Preconfigured demo account fields
  const [demoEmail, setDemoEmail] = useState(DEMO_ACCOUNT_CREDENTIALS.email);
  const [demoPassword, setDemoPassword] = useState(DEMO_ACCOUNT_CREDENTIALS.password);
  const [demoError, setDemoError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.role) {
      navigate('/select-role', { replace: true });
    } else if (user.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (PROVIDER_ROLES.includes(user.role)) {
      navigate('/provider/dashboard', { replace: true });
    } else {
      navigate('/farmer/dashboard', { replace: true });
    }
  }, [user, navigate]);

  function handleContinueAsGuest() {
    enterGuestMode('farmer');
    toast.success('Welcome, Guest! Exploring AgriConnect in Demo Mode.');
    navigate('/farmer/dashboard', { replace: true });
  }

  function handleDemoLoginSubmit(e) {
    if (e) e.preventDefault();
    setDemoError('');
    try {
      loginDemoUser(demoEmail, demoPassword);
      toast.success('Signed in to Demo Mode (demo@agriconnect.in).');
      navigate('/farmer/dashboard', { replace: true });
    } catch (err) {
      const msg = err?.message || 'Invalid demo credentials.';
      setDemoError(msg);
      toast.error(msg);
    }
  }

  function validateInputs() {
    const errors = {};
    const cleanedName = fullName.trim().replace(/\s+/g, ' ');
    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    const cleanedEmail = email.trim();

    if (cleanedName.length < 2) {
      errors.fullName = t('auth.errors.fullNameRequired');
    } else if (cleanedName.length > 100) {
      errors.fullName = t('auth.errors.fullNameTooLong');
    }

    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      errors.mobileNumber = t('auth.errors.mobileInvalid');
    }

    if (cleanedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      errors.email = t('auth.errors.emailInvalid');
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 && voiceEnabled) {
      speak(Object.values(errors)[0]);
    }
    return {
      valid: Object.keys(errors).length === 0,
      cleanedName,
      cleanedMobile,
      cleanedEmail,
    };
  }

  function navigateAfterProfile(resData) {
    if (resData?.isNew || resData?.requiresRoleSelection || !resData?.user?.role) {
      navigate('/select-role', { replace: true });
      return;
    }

    const from = location.state?.from?.pathname;
    if (from && from !== '/login' && from !== '/register' && from !== '/select-role') {
      navigate(from, { replace: true });
      return;
    }

    if (PROVIDER_ROLES.includes(resData.user.role)) {
      navigate('/provider/dashboard', { replace: true });
    } else {
      navigate('/farmer/dashboard', { replace: true });
    }
  }

  async function submitProfile(confirmUseExisting = false) {
    const { valid, cleanedName, cleanedMobile, cleanedEmail } = validateInputs();
    if (!valid) return;

    setServerError('');
    setSubmitting(true);
    try {
      const resData = await continueProfile({
        fullName: cleanedName,
        mobileNumber: cleanedMobile,
        email: cleanedEmail,
        confirmUseExisting,
      });

      if (resData?.conflictDetected && !confirmUseExisting) {
        setConflictData(resData);
        if (voiceEnabled) {
          speak(t('auth.existingProfileFound'));
        }
        return;
      }

      setConflictData(null);
      const displayName = resData?.user?.name || resData?.profile?.full_name || cleanedName;
      toast.success(
        resData?.isNew
          ? t('auth.profileCreatedToast', { name: displayName })
          : t('auth.welcomeBack', { name: displayName })
      );
      navigateAfterProfile(resData);
    } catch (err) {
      const msg = getErrorMessage(err, t('auth.profileSubmitFailed'));
      setServerError(msg);
      toast.error(msg);
      if (voiceEnabled) {
        speak(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    submitProfile(false);
  }

  function toggleVoice() {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (next) {
      speak(`${t('auth.profileEntryTitle')}. ${t('auth.profileEntrySubtitle')}`);
    } else {
      stop();
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-earth-50 via-white to-forest-50">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-earth-200 shadow-lg p-6 sm:p-9 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-earth-200 text-sm font-semibold text-slate-700 hover:bg-earth-50"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.backHome')}
          </Link>

          <div className="flex items-center gap-2">
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={voiceEnabled}
                className={`inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-xs font-semibold transition-colors ${
                  voiceEnabled
                    ? 'border-forest-600 bg-forest-50 text-forest-800'
                    : 'border-earth-200 bg-white text-slate-700 hover:bg-earth-50'
                }`}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-4 h-4 text-forest-700" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                {voiceEnabled ? t('voice.on') : t('voice.off')}
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-forest-700 text-white flex items-center justify-center shadow-sm">
            <Sprout className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
            Access AgriConnect
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
            Explore immediately in Guest Demo Mode or sign in with your AgriConnect profile.
          </p>
        </div>

        {/* Prominent 1-Click Guest / Demo Launch Card */}
        <div className="rounded-2xl bg-gradient-to-r from-forest-700 to-forest-800 p-5 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-bold text-forest-100">
              <Sparkles className="w-3.5 h-3.5 text-fresh-500" /> Instant Access · Hackathon Demo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-forest-100">
            Jump straight into the full dashboard, machinery rentals, labour teams, storage facilities, nearby map, and booking workflows without registration or OTP.
          </p>
          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="w-full min-h-[52px] rounded-xl bg-fresh-500 hover:bg-fresh-600 text-forest-950 font-extrabold text-base shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Compass className="w-5 h-5" />
            Continue as Guest
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-earth-100 border border-earth-200">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === 'profile'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-slate-600 hover:text-forest-800'
            }`}
          >
            Mobile Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demo_account')}
            className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === 'demo_account'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-slate-600 hover:text-forest-800'
            }`}
          >
            Demo User Login
          </button>
        </div>

        {activeTab === 'demo_account' ? (
          <form onSubmit={handleDemoLoginSubmit} noValidate className="space-y-4">
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs sm:text-sm text-amber-950 space-y-1">
              <div className="font-bold">Preconfigured Demo Account (Local Demo Mode)</div>
              <div>
                Email: <code className="font-mono font-bold">{DEMO_ACCOUNT_CREDENTIALS.email}</code> · Password:{' '}
                <code className="font-mono font-bold">{DEMO_ACCOUNT_CREDENTIALS.password}</code>
              </div>
              <div className="text-xs text-amber-800">
                Runs safely in isolated local Demo Mode even when the live backend is offline.
              </div>
            </div>

            {demoError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <span>{demoError}</span>
              </div>
            )}

            <div>
              <label htmlFor="demo-email" className="block text-sm font-bold text-slate-800 mb-1.5">
                Demo Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="demo-email"
                  type="email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-earth-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="demo-password" className="block text-sm font-bold text-slate-800 mb-1.5">
                Demo Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="demo-password"
                  type="password"
                  value={demoPassword}
                  onChange={(e) => setDemoPassword(e.target.value)}
                  className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-earth-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              Sign In with Demo Account
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {serverError && (
              <div
                role="alert"
                className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-900 space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                  <span>{serverError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold"
                >
                  <Compass className="w-4 h-4" /> Continue as Guest Instead
                </button>
              </div>
            )}

            {conflictData?.profile && (
              <div
                role="status"
                className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-bold text-amber-950 text-base">
                      {t('auth.existingProfileFound')}
                    </h2>
                    <p className="text-xs sm:text-sm text-amber-900 mt-0.5">
                      {t('auth.existingProfilePreservedHint')}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-amber-200 p-3 text-sm space-y-1">
                  <div>
                    <span className="text-slate-500">{t('auth.fullNameLabel')}: </span>
                    <span className="font-bold text-slate-900">
                      {conflictData.profile.full_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t('auth.mobileLabel')}: </span>
                    <span className="font-semibold text-slate-900">
                      +91 {conflictData.profile.mobile_number}
                    </span>
                  </div>
                  {conflictData.profile.role && (
                    <div>
                      <span className="text-slate-500">{t('auth.savedRoleLabel')}: </span>
                      <span className="font-bold text-forest-800">
                        {t(`roles.${conflictData.profile.role}`, conflictData.profile.role)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submitProfile(true)}
                    className="flex-1 min-h-[48px] px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t('auth.continueExistingProfile')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConflictData(null)}
                    className="min-h-[48px] px-4 rounded-xl border border-amber-300 bg-white hover:bg-amber-100/50 text-amber-900 font-semibold text-sm"
                  >
                    {t('auth.editDetails')}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="profile-full-name"
                  className="block text-sm font-bold text-slate-800 mb-1.5"
                >
                  {t('auth.fullNameLabel')} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profile-full-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                      setConflictData(null);
                    }}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className={`w-full min-h-[50px] pl-11 pr-4 rounded-xl border text-base focus:outline-none focus:ring-2 ${
                      fieldErrors.fullName
                        ? 'border-rose-400 focus:ring-rose-300 bg-rose-50/40'
                        : 'border-earth-300 focus:ring-forest-600'
                    }`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="profile-mobile"
                  className="block text-sm font-bold text-slate-800 mb-1.5"
                >
                  {t('auth.mobileLabel')} <span className="text-rose-600">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center gap-1.5 px-4 min-h-[50px] rounded-l-xl border border-r-0 border-earth-300 bg-earth-100 text-forest-900 font-bold text-base">
                    <Phone className="w-4 h-4 text-forest-700" />
                    +91
                  </span>
                  <input
                    id="profile-mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobileNumber(digitsOnly);
                      setFieldErrors((prev) => ({ ...prev, mobileNumber: '' }));
                      setConflictData(null);
                    }}
                    placeholder="9876543210"
                    className={`flex-1 min-h-[50px] px-4 rounded-r-xl border text-lg tracking-wider font-semibold focus:outline-none focus:ring-2 ${
                      fieldErrors.mobileNumber
                        ? 'border-rose-400 focus:ring-rose-300 bg-rose-50/40'
                        : 'border-earth-300 focus:ring-forest-600'
                    }`}
                  />
                </div>
                {fieldErrors.mobileNumber ? (
                  <p className="text-xs font-medium text-rose-600 mt-1">
                    {fieldErrors.mobileNumber}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">{t('auth.mobileTenDigitsHint')}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-sm font-bold text-slate-800 mb-1.5"
                >
                  {t('auth.emailOptionalLabel')}
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profile-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                      setConflictData(null);
                    }}
                    placeholder={t('auth.emailOptionalPlaceholder')}
                    className={`w-full min-h-[50px] pl-11 pr-4 rounded-xl border text-base focus:outline-none focus:ring-2 ${
                      fieldErrors.email
                        ? 'border-rose-400 focus:ring-rose-300 bg-rose-50/40'
                        : 'border-earth-300 focus:ring-forest-600'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[52px] rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('common.pleaseWait')}
                  </>
                ) : (
                  <>
                    {t('common.continue')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="pt-2 border-t border-earth-200 flex items-center justify-between text-sm">
          <Link
            to="/labour-demo"
            className="inline-flex items-center gap-1.5 text-forest-700 font-semibold hover:underline"
          >
            <PlayCircle className="w-4 h-4" />
            {t('auth.tryLabourDemo')}
          </Link>
          <Link to="/how-it-works" className="text-slate-600 hover:text-forest-700 font-medium">
            {t('nav.howItWorks')}
          </Link>
        </div>
      </div>
    </div>
  );
}
