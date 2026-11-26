import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Users,
  Tractor,
  Warehouse,
  CalendarCheck,
  PlayCircle,
  Bell,
  MapPin,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  Home,
  PlusCircle,
  RefreshCw,
  Loader2,
  ClipboardList,
  Settings,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import LocationSelector from '../../components/LocationSelector';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/distance';

export default function FarmerDashboard() {
  const { user, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { coords, hasCoords, radius, detectBrowserLocation, detecting } =
    useLocationContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/discovery/dashboard', {
        params: hasCoords ? { lat: coords.lat, lng: coords.lng, radius } : {},
      })
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [coords?.lat, coords?.lng, hasCoords, radius]);

  async function handleRefreshProfileGps() {
    const captured = await detectBrowserLocation();
    if (!captured) {
      toast.error(t('gps.unavailable'));
      return;
    }
    try {
      await updateProfile({
        village: captured.village || user?.village || '',
        district: captured.district || user?.district || '',
        state: captured.state || user?.state || '',
        location: {
          lat: captured.lat,
          lng: captured.lng,
          address: captured.formattedAddress || user?.location?.address || '',
        },
      });
      toast.success(t('gps.capturedSuccess'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('dashboard.gpsProfileError')));
    }
  }

  const pendingAppsCount = stats?.pendingApplicationsCount || 0;
  const upcomingCount = (stats?.upcomingBookings || []).length;
  const totalAlerts = pendingAppsCount + upcomingCount;

  const actionCards = [
    {
      to: '/machinery',
      icon: Tractor,
      title: t('dashboard.actions.findEquipment'),
      desc: t('dashboard.actions.findEquipmentDesc'),
      iconCls: 'bg-forest-50 text-forest-700',
    },
    {
      to: '/labour',
      icon: Users,
      title: t('dashboard.actions.findWorkers'),
      desc: t('dashboard.actions.findWorkersDesc'),
      iconCls: 'bg-harvest-100 text-harvest-700',
    },
    {
      to: '/facilities',
      icon: Warehouse,
      title: t('dashboard.actions.findFacilities'),
      desc: t('dashboard.actions.findFacilitiesDesc'),
      iconCls: 'bg-sky-50 text-sky-700',
    },
    {
      to: '/farmer/request-labour#my-requests',
      icon: ClipboardList,
      title: t('dashboard.actions.myLabourRequests'),
      desc: t('dashboard.actions.myLabourRequestsDesc'),
      iconCls: 'bg-emerald-50 text-emerald-700',
    },
    {
      to: '/farmer/bookings',
      icon: CalendarCheck,
      title: t('dashboard.actions.myBookings'),
      desc: t('dashboard.actions.myBookingsDesc'),
      iconCls: 'bg-forest-50 text-forest-700',
    },
    {
      to: '/labour-demo',
      icon: PlayCircle,
      title: t('dashboard.actions.labourDemo'),
      desc: t('dashboard.actions.labourDemoDesc'),
      iconCls: 'bg-amber-50 text-amber-700',
    },
    {
      to: '/profile',
      icon: Settings,
      title: t('dashboard.actions.profileSettings'),
      desc: t('dashboard.actions.profileSettingsDesc'),
      iconCls: 'bg-earth-100 text-earth-700',
    },
    {
      to: '/nearby-map',
      icon: MapPin,
      title: t('dashboard.actions.nearbyMap'),
      desc: t('dashboard.actions.nearbyMapDesc'),
      iconCls: 'bg-sky-50 text-sky-700',
    },
  ];

  const locationSummaryText =
    [user?.village, user?.district, user?.state].filter(Boolean).join(', ') ||
    t('dashboard.locationNotAdded');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
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

      {/* Top Farmer Header Bar */}
      <div className="bg-white rounded-3xl border border-earth-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/images/hero-farmer.jpg"
              alt={user?.name || t('roles.farmer')}
              className="w-16 h-16 rounded-2xl object-cover object-right border-2 border-forest-200 shrink-0"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-forest-900">
                {t('dashboard.welcome', { name: user?.name || t('roles.farmer') })}
              </h1>
              <div className="text-xs sm:text-sm text-slate-600 flex flex-wrap items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 font-medium">
                  <MapPin className="w-4 h-4 text-forest-700 shrink-0" />
                  {locationSummaryText}
                </span>
                {user?.primaryCrop && <span>· {user.primaryCrop}</span>}
                <button
                  type="button"
                  onClick={handleRefreshProfileGps}
                  disabled={detecting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-50 text-forest-800 hover:bg-forest-100 text-xs font-semibold disabled:opacity-60"
                >
                  {detecting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  {hasCoords ? t('gps.refreshBtn') : t('gps.useCurrentBtn')}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1 hidden sm:block">
                {t('dashboard.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <LanguageSwitcher compact />

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label={t('dashboard.notifications')}
                className="relative min-h-[44px] min-w-[44px] px-3 inline-flex items-center gap-1.5 rounded-xl border border-earth-200 bg-earth-50 hover:bg-earth-100 text-slate-700 text-xs font-semibold"
              >
                <Bell className="w-4 h-4 text-forest-700" />
                <span className="hidden sm:inline">{t('dashboard.notifications')}</span>
                {totalAlerts > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-forest-700 text-white text-[10px] font-bold">
                    {totalAlerts}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-earth-200 shadow-lg p-4 z-30 space-y-2 text-xs">
                  <div className="font-bold text-slate-900">
                    {t('dashboard.notifications')}
                  </div>
                  {pendingAppsCount > 0 && (
                    <Link
                      to="/farmer/request-labour"
                      onClick={() => setNotifOpen(false)}
                      className="block p-2.5 rounded-xl bg-forest-50 text-forest-800 font-semibold hover:bg-forest-100"
                    >
                      {t('dashboard.pendingAppsAlert', { count: pendingAppsCount })}
                    </Link>
                  )}
                  {upcomingCount > 0 && (
                    <Link
                      to="/farmer/bookings"
                      onClick={() => setNotifOpen(false)}
                      className="block p-2.5 rounded-xl bg-sky-50 text-sky-900 font-semibold hover:bg-sky-100"
                    >
                      {t('dashboard.upcomingBookingsAlert', { count: upcomingCount })}
                    </Link>
                  )}
                  {totalAlerts === 0 && (
                    <p className="text-slate-500">{t('dashboard.noAlerts')}</p>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/profile"
              className="min-h-[44px] px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-earth-200 hover:bg-earth-50 text-xs sm:text-sm font-semibold text-slate-800"
            >
              <UserIcon className="w-4 h-4 text-forest-700" />
              {t('nav.profile')}
            </Link>
          </div>
        </div>
      </div>

      {/* Prominent Request Labour Hero Card + Discovery & Management Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Link
          to="/farmer/request-labour"
          className="lg:col-span-4 bg-forest-700 hover:bg-forest-800 text-white rounded-3xl p-6 sm:p-7 shadow-md transition-colors flex flex-col justify-between min-h-[200px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-14 h-14 rounded-2xl bg-fresh-500 text-forest-900 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
              {t('dashboard.postNewRequest')}
            </span>
          </div>
          <div className="mt-5">
            <h2 className="text-2xl font-extrabold">{t('dashboard.actions.requestLabour')}</h2>
            <p className="text-sm text-forest-100 mt-1">
              {t('dashboard.actions.requestLabourDesc')}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-forest-800 font-bold text-sm">
              <PlusCircle className="w-4 h-4" />
              {t('dashboard.actions.requestLabour')}
            </div>
          </div>
        </Link>

        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="bg-white hover:border-forest-500 rounded-2xl border border-earth-200 p-4 shadow-sm transition-all flex flex-col justify-between min-h-[125px]"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconCls}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-3">
                  <div className="font-bold text-sm text-slate-900 flex items-center justify-between gap-1">
                    <span>{card.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{card.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <LocationSelector />

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500">
          {t('common.loading')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Labour Requests */}
          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {t('dashboard.myLabourRequests')}
              </h2>
              <Link
                to="/farmer/request-labour"
                className="text-xs font-bold text-forest-700 hover:underline inline-flex items-center gap-1"
              >
                {t('dashboard.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(stats?.labourRequests || []).length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                {t('dashboard.noLabourRequests')}
              </p>
            ) : (
              <div className="space-y-3">
                {stats.labourRequests.map((req) => (
                  <Link
                    key={req._id}
                    to="/farmer/request-labour"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-earth-200 hover:bg-earth-50 transition-colors gap-2"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {t(`categories.labour.${req.category}`, req.category)} ·{' '}
                        <span className="text-xs font-mono text-slate-500">
                          {req.requestCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {req.workersAccepted}/{req.workersRequired} {t('common.workers')} ·{' '}
                        {formatDate(req.startDate, i18n.language)} ·{' '}
                        {formatCurrency(req.estimatedTotal, i18n.language)}
                      </div>
                    </div>
                    <BookingStatusBadge status={req.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming & Recent Equipment/Facility Bookings */}
          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {t('dashboard.upcomingBookings')}
              </h2>
              <Link
                to="/farmer/bookings"
                className="text-xs font-bold text-forest-700 hover:underline inline-flex items-center gap-1"
              >
                {t('dashboard.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(stats?.recentActivity || []).length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                {t('dashboard.noBookings')}
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 4).map((b) => (
                  <Link
                    key={b._id}
                    to={`/bookings/${b._id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-earth-200 hover:bg-earth-50 transition-colors gap-2"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {b.serviceName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDate(b.bookingDate, i18n.language)} ·{' '}
                        {formatCurrency(b.estimatedCost, i18n.language)}
                      </div>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
