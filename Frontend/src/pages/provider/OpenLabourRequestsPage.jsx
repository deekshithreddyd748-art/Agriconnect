import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Phone,
  Lock,
  Play,
  Flag,
  Send,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';
import LocationSelector from '../../components/LocationSelector';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { LABOUR_CATEGORIES } from '../../utils/constants';
import { formatCurrency, formatDate, formatDistanceLabel } from '../../utils/distance';

const FILTER_CATEGORIES = ['All', ...LABOUR_CATEGORIES];

export default function OpenLabourRequestsPage() {
  const { t, i18n } = useTranslation();
  const { coords, hasCoords, radius } = useLocationContext();

  const [tab, setTab] = useState('open');
  const [category, setCategory] = useState('All');
  const [district, setDistrict] = useState('');
  const [requests, setRequests] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  function loadData() {
    setLoading(true);
    Promise.all([
      api.get('/labour-requests', {
        params: {
          category,
          district,
          ...(hasCoords ? { lat: coords.lat, lng: coords.lng, radius } : {}),
        },
      }),
      api.get('/labour-requests/worker/bookings'),
      api.get('/labour-requests/worker/my-applications'),
    ])
      .then(([reqRes, bookingsRes, appRes]) => {
        setRequests(reqRes.data.data || []);
        setConfirmedBookings(bookingsRes.data.data || []);
        setApplications(appRes.data.data || []);
      })
      .catch(() => {
        setRequests([]);
        setConfirmedBookings([]);
        setApplications([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [category, district, coords?.lat, coords?.lng, hasCoords, radius]);

  async function handleAcceptRequest(reqId) {
    setBusyId(`accept-${reqId}`);
    try {
      const res = await api.post(`/labour-requests/${reqId}/accept`);
      const code = res.data?.data?.booking?.bookingCode || '';
      toast.success(t('worker.acceptedSuccess', { code }));
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, t('worker.acceptFailed')));
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdateBookingStatus(bookingId, bookingStatus) {
    setBusyId(`status-${bookingId}`);
    try {
      await api.patch(`/labour-requests/bookings/${bookingId}/status`, {
        bookingStatus,
      });
      toast.success(
        t('labourRequest.bookingUpdatedMsg', {
          status: t(`statuses.${bookingStatus}`, bookingStatus),
        })
      );
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    } finally {
      setBusyId(null);
    }
  }

  async function handleApply(reqId) {
    setBusyId(`apply-${reqId}`);
    try {
      await api.post(`/labour-requests/${reqId}/apply`, {
        numberOfWorkers: 1,
        message: 'Available to join on the requested dates.',
      });
      toast.success(t('worker.appliedMsg'));
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
            {t('worker.openRequestsTitle')}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {t('worker.openRequestsSubtitle')}
          </p>
        </div>

        <div className="inline-flex flex-wrap bg-white border border-earth-200 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setTab('open')}
            className={`min-h-[44px] px-3.5 rounded-lg text-xs font-bold ${
              tab === 'open'
                ? 'bg-forest-700 text-white'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            {t('worker.openRequestsTab')} ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('confirmed')}
            className={`min-h-[44px] px-3.5 rounded-lg text-xs font-bold ${
              tab === 'confirmed'
                ? 'bg-forest-700 text-white'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            {t('worker.confirmedJobsTab')} ({confirmedBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('apps')}
            className={`min-h-[44px] px-3.5 rounded-lg text-xs font-bold ${
              tab === 'apps'
                ? 'bg-forest-700 text-white'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            {t('worker.myApplicationsTab')} ({applications.length})
          </button>
        </div>
      </div>

      {tab === 'open' && (
        <>
          <LocationSelector />

          <div className="bg-white rounded-2xl border border-earth-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-[44px] px-3 rounded-xl border border-earth-200 text-sm bg-white"
            >
              {FILTER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All'
                    ? t('worker.allCategories')
                    : t(`labourRequest.categories.${c}`, c)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder={t('worker.filterDistrictPlaceholder')}
              className="min-h-[44px] px-3 rounded-xl border border-earth-200 text-sm"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              {t('common.loading')}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-earth-200 p-10 text-center text-sm text-slate-600">
              {t('worker.noOpenRequests')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {requests.map((req) => {
                const remaining =
                  req.remainingVacancies !== undefined
                    ? req.remainingVacancies
                    : Math.max(0, req.workersRequired - req.workersAccepted);

                return (
                  <div
                    key={req._id}
                    className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {req.requestCode}
                        </span>
                        <BookingStatusBadge status={req.status} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {t(`labourRequest.categories.${req.category}`, req.category)}
                      </h3>
                      <div className="text-xs text-slate-600 space-y-1.5">
                        <div>
                          {t('worker.farmerLabel')}:{' '}
                          <strong>{req.farmerId?.name}</strong>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />{' '}
                          {formatDate(req.startDate, i18n.language)} ({req.durationDays}{' '}
                          {t('common.days')})
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-forest-800">
                          <Users className="w-3.5 h-3.5" />
                          {t('worker.vacanciesBadge', {
                            remaining,
                            required: req.workersRequired,
                          })}
                        </div>
                        <div className="flex items-center gap-1 text-forest-700 font-semibold">
                          <MapPin className="w-3.5 h-3.5" /> {req.location?.village},{' '}
                          {req.location?.district} · {formatDistanceLabel(req)}
                        </div>
                        {req.farmerId?.phone ? (
                          <div className="flex items-center gap-1 text-emerald-700 font-bold">
                            <Phone className="w-3.5 h-3.5" /> {req.farmerId.phone}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span>{t('worker.contactHiddenHint')}</span>
                          </div>
                        )}
                      </div>
                      {req.instructions && (
                        <p className="text-xs text-slate-600 bg-earth-50 p-2.5 rounded-xl">
                          {req.instructions}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-earth-200 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xl font-extrabold text-forest-900">
                            {formatCurrency(req.dailyWage, i18n.language)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {t('common.perDay')}
                          </div>
                        </div>

                        {req.myBooking ? (
                          <BookingStatusBadge status={req.myBooking.bookingStatus} />
                        ) : remaining > 0 ? (
                          <button
                            type="button"
                            disabled={busyId === `accept-${req._id}`}
                            onClick={() => handleAcceptRequest(req._id)}
                            className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {busyId === `accept-${req._id}`
                              ? t('worker.acceptingBtn')
                              : t('worker.acceptBtn')}
                          </button>
                        ) : (
                          <BookingStatusBadge status="Fully Filled" />
                        )}
                      </div>

                      {!req.myBooking && !req.myApplication && remaining > 0 && (
                        <button
                          type="button"
                          disabled={busyId === `apply-${req._id}`}
                          onClick={() => handleApply(req._id)}
                          className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-earth-200 text-slate-600 hover:bg-earth-50 text-xs font-semibold"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {busyId === `apply-${req._id}`
                            ? t('worker.applyingBtn')
                            : t('worker.applyBtn')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'confirmed' && (
        <div className="space-y-3">
          {confirmedBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-earth-200 p-10 text-center text-sm text-slate-500">
              {t('worker.noConfirmedJobs')}
            </div>
          ) : (
            confirmedBookings.map((bk) => {
              const req = bk.labourRequestId || {};
              return (
                <div
                  key={bk._id}
                  className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {t('worker.bookingCodeLabel')}: {bk.bookingCode}
                      </span>
                      <BookingStatusBadge status={bk.bookingStatus} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {t(`labourRequest.categories.${req.category}`, req.category)} ·{' '}
                      {req.requestCode}
                    </h3>
                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        {t('worker.farmerLabel')}: <strong>{bk.farmerId?.name}</strong>
                      </span>
                      {bk.farmerId?.phone && (
                        <span className="inline-flex items-center gap-1 text-forest-800 font-bold">
                          <Phone className="w-3.5 h-3.5" /> {bk.farmerId.phone}
                        </span>
                      )}
                      <span>
                        <MapPin className="w-3.5 h-3.5 inline mr-0.5" />
                        {[req.location?.village, req.location?.district]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                      <span>
                        <Calendar className="w-3.5 h-3.5 inline mr-0.5" />
                        {formatDate(req.startDate, i18n.language)} ({req.durationDays}{' '}
                        {t('common.days')})
                      </span>
                      <span className="font-bold text-forest-900">
                        {formatCurrency(req.dailyWage, i18n.language)} {t('common.perDay')}
                      </span>
                    </div>
                  </div>

                  {['Accepted', 'In Progress'].includes(bk.bookingStatus) && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {bk.bookingStatus === 'Accepted' && (
                        <button
                          type="button"
                          disabled={busyId === `status-${bk._id}`}
                          onClick={() => handleUpdateBookingStatus(bk._id, 'In Progress')}
                          className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                        >
                          <Play className="w-3.5 h-3.5" />
                          {t('worker.startJobBtn')}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === `status-${bk._id}`}
                        onClick={() => handleUpdateBookingStatus(bk._id, 'Completed')}
                        className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        {t('worker.completeJobBtn')}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === `status-${bk._id}`}
                        onClick={() => handleUpdateBookingStatus(bk._id, 'Cancelled')}
                        className="min-h-[40px] px-3.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold"
                      >
                        {t('worker.cancelJobBtn')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'apps' && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-earth-200 p-10 text-center text-sm text-slate-500">
              {t('worker.noApplications')}
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {app.requestId?.requestCode}
                    </span>
                    <BookingStatusBadge status={app.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t(
                      `labourRequest.categories.${app.requestId?.category}`,
                      app.requestId?.category
                    )}
                  </h3>
                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      {t('worker.farmerLabel')}: <strong>{app.requestId?.farmerId?.name}</strong>
                    </span>
                    <span>
                      {t('common.date')}:{' '}
                      <strong>{formatDate(app.requestId?.startDate, i18n.language)}</strong> (
                      {app.requestId?.durationDays} {t('common.days')})
                    </span>
                    <span>
                      <strong>
                        {formatCurrency(app.requestId?.dailyWage, i18n.language)}
                        {t('common.perDay')}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
