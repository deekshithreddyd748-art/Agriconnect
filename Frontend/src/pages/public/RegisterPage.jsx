import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlus, Crosshair } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { LANGUAGES, PRESET_LOCATIONS, PROVIDER_ROLES } from '../../utils/constants';
import { LocationPickerMap } from '../../components/ServiceMap';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState({ lat: 18.1517, lng: 74.5777 });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'farmer',
      language: 'English',
      village: 'Baramati',
      district: 'Pune',
      state: 'Maharashtra',
    },
  });

  function useBrowserGps() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        });
        toast.success('GPS coordinates captured.');
      },
      () => toast.error('Could not access GPS. You can click the map or pick a town.')
    );
  }

  function applyPreset(e) {
    const idx = e.target.value;
    if (idx === '') return;
    const loc = PRESET_LOCATIONS[Number(idx)];
    if (!loc) return;
    setValue('village', loc.village);
    setValue('district', loc.district);
    setValue('state', loc.state);
    setCoords({ lat: loc.lat, lng: loc.lng });
  }

  async function onSubmit(data) {
    setSubmitting(true);
    try {
      const user = await registerUser({
        ...data,
        location: {
          lat: coords.lat,
          lng: coords.lng,
          address: [data.village, data.district, data.state].filter(Boolean).join(', '),
        },
      });
      toast.success('Account created! Welcome to AgriConnect.');
      if (PROVIDER_ROLES.includes(user.role)) {
        navigate('/provider/dashboard', { replace: true });
      } else {
        navigate('/farmer/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-forest-900">
          Join AgriConnect
        </h1>
        <p className="text-sm text-slate-600 mt-1 mb-6">
          Create your farmer or service provider account to start discovering and
          booking hyperlocal agricultural services.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Full name is required' })}
                placeholder="e.g., Ramesh Pawar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                {...register('phone', { required: 'Mobile number is required' })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
              {errors.phone && (
                <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
              {errors.email && (
                <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
              />
              {errors.password && (
                <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                User Role *
              </label>
              <select
                {...register('role', { required: true })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 bg-white text-sm"
              >
                <option value="farmer">Farmer (Book Services)</option>
                <option value="equipment_owner">Equipment Owner (Rent Machinery)</option>
                <option value="labour_provider">Labour Provider (Offer Farm Teams)</option>
                <option value="facility_operator">Facility Operator (Storage / Mills)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Preferred Language
              </label>
              <select
                {...register('language')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 bg-white text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-earth-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">
                Location Details
              </span>
              <div className="flex flex-wrap gap-2">
                <select
                  onChange={applyPreset}
                  defaultValue=""
                  className="px-3 py-1.5 rounded-lg border border-earth-200 text-xs bg-earth-50"
                >
                  <option value="" disabled>
                    Quick Fill Town...
                  </option>
                  {PRESET_LOCATIONS.map((loc, idx) => (
                    <option key={loc.label} value={idx}>
                      {loc.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={useBrowserGps}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-50 text-forest-700 text-xs font-semibold hover:bg-forest-100"
                >
                  <Crosshair className="w-3.5 h-3.5" /> Detect GPS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Village / Town *
                </label>
                <input
                  type="text"
                  {...register('village', { required: 'Village is required' })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  District *
                </label>
                <input
                  type="text"
                  {...register('district', { required: 'District is required' })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  {...register('state', { required: 'State is required' })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-200 text-sm"
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1.5">
                Optional: Click on the map to pin your exact farm or service coordinates (
                {coords.lat}, {coords.lng})
              </p>
              <LocationPickerMap
                lat={coords.lat}
                lng={coords.lng}
                onSelect={(lat, lng) => setCoords({ lat, lng })}
                height="200px"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-center text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-forest-700 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
