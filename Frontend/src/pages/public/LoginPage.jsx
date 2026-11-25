import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LogIn, Sprout, KeyRound, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { PROVIDER_ROLES } from '../../utils/constants';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const DEMO_ACCOUNTS = [
  { label: 'Farmer (Rajesh Patil)', email: 'farmer@agriconnect.in', pass: 'Demo@123' },
  { label: 'Equipment Owner', email: 'owner@agriconnect.in', pass: 'Demo@123' },
  { label: 'Labour Provider', email: 'labour@agriconnect.in', pass: 'Demo@123' },
  { label: 'Facility Owner', email: 'facility@agriconnect.in', pass: 'Demo@123' },
  { label: 'Administrator', email: 'admin@agriconnect.in', pass: 'Admin@123' },
];

export default function LoginPage() {
  const { login, sendOtp, verifyOtp } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('otp');
  const [submitting, setSubmitting] = useState(false);

  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [mockOtpHint, setMockOtpHint] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  function redirectByRole(user) {
    const from = location.state?.from?.pathname;
    if (from) return navigate(from, { replace: true });
    if (user.role === 'admin') return navigate('/admin', { replace: true });
    if (PROVIDER_ROLES.includes(user.role)) {
      return navigate('/provider/dashboard', { replace: true });
    }
    return navigate('/farmer/dashboard', { replace: true });
  }

  async function onEmailSubmit(data) {
    setSubmitting(true);
    try {
      const loggedInUser = await login(data.email, data.password);
      toast.success(`Welcome back, ${loggedInUser.name}!`);
      redirectByRole(loggedInUser);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    const digits = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      toast.error(t('auth.invalidMobile'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await sendOtp(digits);
      setOtpSent(true);
      setMockOtpHint(res.demoOtpMode ? res.mockOtp : '');
      toast.success(
        res.demoOtpMode
          ? t('auth.demoOtpNotice', { otp: res.mockOtp })
          : 'OTP sent to your mobile.'
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send OTP.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const digits = mobileNumber.replace(/\D/g, '');
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error(t('auth.invalidOtp'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await verifyOtp(digits, otp.trim());
      if (res.isNewUser) {
        toast('New mobile number verified! Complete registration to create your profile.');
        navigate('/register');
        return;
      }
      toast.success(`Welcome back, ${res.user.name}!`);
      redirectByRole(res.user);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid OTP.'));
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(account) {
    setMode('email');
    setValue('email', account.email);
    setValue('password', account.pass);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex justify-end mb-4">
        <LanguageSwitcher />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-7 bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-11 h-11 rounded-xl bg-forest-700 text-white flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-forest-900">
                {t('auth.loginTitle')}
              </h1>
              <p className="text-xs text-slate-500">{t('auth.loginSubtitle')}</p>
            </div>
          </div>

          {/* Auth Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-earth-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setMode('otp')}
              className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                mode === 'otp'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white/60'
              }`}
            >
              {t('auth.mobileOtpTab')}
            </button>
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                mode === 'email'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white/60'
              }`}
            >
              {t('auth.emailPassTab')}
            </button>
          </div>

          {mode === 'otp' ? (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5">
                    <Phone className="w-4 h-4 text-forest-700" />
                    {t('auth.mobileLabel')}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 min-h-[48px] inline-flex items-center rounded-xl bg-earth-100 border border-earth-200 font-bold text-slate-700">
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
                      className="flex-1 min-h-[48px] px-3.5 rounded-xl border border-earth-200 text-base font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Demo farmer mobile: <strong>9823011223</strong> · Demo labour mobile:{' '}
                    <strong>9890177889</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm disabled:opacity-60"
                >
                  {submitting ? t('auth.sendingOtp') : t('auth.sendOtp')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {mockOtpHint && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 font-semibold">
                    {t('auth.demoOtpNotice', { otp: mockOtpHint })}
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-forest-700" />
                    {t('auth.otpLabel')} (+91 {mobileNumber})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('auth.otpPlaceholder')}
                    className="w-full min-h-[50px] px-4 rounded-xl border-2 border-earth-200 text-center text-xl font-extrabold tracking-[0.35em]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className="px-4 min-h-[48px] rounded-xl border border-earth-200 text-xs font-semibold"
                  >
                    {t('auth.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm disabled:opacity-60"
                  >
                    {submitting ? t('auth.verifyingOtp') : t('auth.verifyOtp')}
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  {...register('email', { required: t('auth.requiredField') })}
                  placeholder="you@example.com"
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  {...register('password', { required: t('auth.requiredField') })}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
                {errors.password && (
                  <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-colors disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? t('common.loading') : t('auth.loginBtn')}
              </button>
            </form>
          )}

          <p className="mt-5 text-sm text-center text-slate-600">
            <Link to="/register" className="text-forest-700 font-bold hover:underline">
              {t('auth.newAccountLink')}
            </Link>
          </p>
        </div>

        <div className="md:col-span-5 bg-forest-50 rounded-3xl border border-forest-200 p-6 space-y-3">
          <div className="flex items-center gap-2 text-forest-900 font-bold">
            <KeyRound className="w-4 h-4" />
            Hackathon Demo Accounts
          </div>
          <p className="text-xs text-forest-800 leading-relaxed">
            Click any role below to auto-fill credentials, then click <strong>Log In</strong>.
          </p>
          <div className="space-y-2 pt-1">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc)}
                className="w-full text-left p-3 min-h-[48px] rounded-xl bg-white border border-forest-200 hover:border-forest-500 transition-colors"
              >
                <div className="text-sm font-semibold text-forest-900">{acc.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {acc.email} · {acc.pass}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
