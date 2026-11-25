import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LogIn, Sprout, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { PROVIDER_ROLES } from '../../utils/constants';

const DEMO_ACCOUNTS = [
  { label: 'Farmer (Rajesh Patil)', email: 'farmer@agriconnect.in', pass: 'Demo@123' },
  { label: 'Equipment Owner', email: 'owner@agriconnect.in', pass: 'Demo@123' },
  { label: 'Labour Provider', email: 'labour@agriconnect.in', pass: 'Demo@123' },
  { label: 'Facility Operator', email: 'facility@agriconnect.in', pass: 'Demo@123' },
  { label: 'Administrator', email: 'admin@agriconnect.in', pass: 'Admin@123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

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

  async function onSubmit(data) {
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

  function fillDemo(account) {
    setValue('email', account.email);
    setValue('password', account.pass);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-7 bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-forest-900">Sign In to AgriConnect</h1>
              <p className="text-xs text-slate-500">Access your farmer or provider dashboard</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
              />
              {errors.email && (
                <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
              />
              {errors.password && (
                <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? 'Signing In...' : 'Log In'}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-slate-600">
            New to AgriConnect?{' '}
            <Link to="/register" className="text-forest-700 font-semibold hover:underline">
              Create an account
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
                className="w-full text-left p-3 rounded-xl bg-white border border-forest-200 hover:border-forest-500 transition-colors"
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
