import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  PackageCheck,
  Inbox,
  CheckCircle2,
  IndianRupee,
  ToggleLeft,
  ArrowRight,
  ArrowLeft,
  Home,
  Briefcase,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/distance';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/discovery/dashboard')
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const roleHeadingKey =
    user?.role === 'equipment_owner'
      ? 'provider.equipmentDashboardTitle'
      : user?.role === 'labour_provider'
        ? 'provider.labourDashboardTitle'
        : user?.role === 'facility_operator'
          ? 'provider.facilityDashboardTitle'
          : 'provider.dashboardTitle';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-earth-200 bg-white text-sm font-semibold text-slate-700 hover:bg-earth-50"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-earth-200 bg-white text-sm font-semibold text-slate-700 hover:bg-earth-50"
        >
          <Home className="w-4 h-4 text-forest-700" />
          {t('common.home')}
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
            {t(`roles.${user?.role}`, user?.role)} · {t(roleHeadingKey, t('provider.dashboardTitle'))}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900 mt-0.5">
            {t('provider.welcome', { name: user?.name })}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {user?.role === 'labour_provider' && (
            <Link
              to="/provider/open-requests"
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-harvest-600 hover:bg-harvest-700 text-white text-sm font-semibold"
            >
              <Briefcase className="w-4 h-4" /> {t('provider.actions.openLabourRequests')}
            </Link>
          )}
          <Link
            to="/provider/listings/new"
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" /> {t('provider.actions.addNewListing')}
          </Link>
          <Link
            to="/provider/listings"
            className="px-4 min-h-[44px] inline-flex items-center rounded-xl bg-white border border-earth-200 text-slate-800 text-sm font-semibold hover:bg-earth-50"
          >
            {t('provider.actions.manageListings')}
          </Link>
          <Link
            to="/provider/requests"
            className="px-4 min-h-[44px] inline-flex items-center rounded-xl bg-white border border-earth-200 text-slate-800 text-sm font-semibold hover:bg-earth-50"
          >
            {t('provider.actions.viewRequests')}
          </Link>
          <Link
            to="/provider/availability"
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-forest-50 text-forest-800 text-sm font-semibold hover:bg-forest-100"
          >
            <ToggleLeft className="w-4 h-4" /> {t('provider.actions.manageAvailability')}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          {t('common.loading')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                {t('provider.stats.activeListings')}
                <PackageCheck className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.activeListings ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                / {stats?.totalListings ?? 0}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                {t('provider.stats.pendingRequests')}
                <Inbox className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-amber-700 mt-2">
                {stats?.pendingRequestsCount ?? 0}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                {t('statuses.Accepted')}
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.acceptedBookingsCount ?? 0}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                {t('statuses.Completed')}
                <CheckCircle2 className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.completedServicesCount ?? 0}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                {t('provider.stats.totalEarnings')}
                <IndianRupee className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-2xl font-extrabold text-forest-900 mt-2">
                {formatCurrency(stats?.estimatedEarnings ?? 0, i18n.language)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {t('provider.bookingsTitle')}
              </h2>
              <Link
                to="/provider/bookings"
                className="text-xs font-semibold text-forest-700 hover:underline inline-flex items-center gap-1"
              >
                {t('dashboard.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(stats?.recentRequests || []).length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                {t('provider.noIncomingBookings')}
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentRequests.map((b) => (
                  <Link
                    key={b._id}
                    to={`/bookings/${b._id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-earth-200 hover:bg-earth-50"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {b.serviceName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {b.farmerId?.name} · {formatDate(b.bookingDate, i18n.language)} ·{' '}
                        {formatCurrency(b.estimatedCost, i18n.language)}
                      </div>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
