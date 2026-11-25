import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users, CheckCircle2, Send } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';
import LocationSelector from '../../components/LocationSelector';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDistanceLabel } from '../../utils/distance';

const CATEGORIES = [
  'All',
  'Sowing / Planting',
  'Harvesting',
  'Weeding',
  'Pesticide Spraying',
  'Tractor / Machinery Operator',
  'Irrigation Work',
  'General Farm Help',
  'Other',
];

export default function OpenLabourRequestsPage() {
  const { t } = useTranslation();
  const { coords, hasCoords, radius } = useLocationContext();

  const [tab, setTab] = useState('open');
  const [category, setCategory] = useState('All');
  const [district, setDistrict] = useState('');
  const [requests, setRequests] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);

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
      api.get('/labour-requests/worker/my-applications'),
    ])
      .then(([reqRes, appRes]) => {
        setRequests(reqRes.data.data || []);
        setApplications(appRes.data.data || []);
      })
      .catch(() => {
        setRequests([]);
        setApplications([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [category, district, coords?.lat, coords?.lng, hasCoords, radius]);

  async function handleApply(reqId) {
    setApplyingId(reqId);
    try {
      await api.post(`/labour-requests/${reqId}/apply`, {
        message: 'Available to join on the requested dates.',
      });
      toast.success(t('worker.appliedMsg'));
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit application.'));
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
            {t('worker.openRequestsTitle')}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {t('worker.openRequestsSubtitle')}
          </p>
        </div>

        <div className="inline-flex bg-white border border-earth-200 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setTab('open')}
            className={`min-h-[44px] px-4 rounded-lg text-xs font-bold ${
              tab === 'open'
                ? 'bg-forest-700 text-white'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            {t('worker.openRequestsTab')} ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('apps')}
            className={`min-h-[44px] px-4 rounded-lg text-xs font-bold ${
              tab === 'apps'
                ? 'bg-forest-700 text-white'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            {t('worker.myApplicationsTab')} ({applications.length})
          </button>
        </div>
      </div>

      {tab === 'open' ? (
        <>
          <LocationSelector />

          <div className="bg-white rounded-2xl border border-earth-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-[44px] px-3 rounded-xl border border-earth-200 text-sm bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All'
                    ? 'All Work Categories'
                    : t(`labourRequest.categories.${c}`, c)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Filter by district (e.g. Pune)"
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
              {requests.map((req) => (
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
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        Farmer: <strong>{req.farmerId?.name}</strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Start: {req.startDate} (
                        {req.durationDays} {t('common.days')})
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Positions:{' '}
                        {req.workersAccepted}/{req.workersRequired} filled
                      </div>
                      <div className="flex items-center gap-1 text-forest-700 font-semibold">
                        <MapPin className="w-3.5 h-3.5" /> {req.location?.village},{' '}
                        {req.location?.district} · {formatDistanceLabel(req)}
                      </div>
                    </div>
                    {req.instructions && (
                      <p className="text-xs text-slate-600 bg-earth-50 p-2.5 rounded-xl">
                        {req.instructions}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-earth-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xl font-extrabold text-forest-900">
                        {formatCurrency(req.dailyWage)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t('common.perDay')}
                      </div>
                    </div>

                    {req.myApplication ? (
                      <div className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-forest-700" />
                        <BookingStatusBadge status={req.myApplication.status} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={applyingId === req._id}
                        onClick={() => handleApply(req._id)}
                        className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold disabled:opacity-60"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {applyingId === req._id
                          ? t('worker.applyingBtn')
                          : t('worker.applyBtn')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-earth-200 p-10 text-center text-sm text-slate-500">
              You have not applied to any farmer requests yet.
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
                      Farmer: <strong>{app.requestId?.farmerId?.name}</strong> (
                      {app.requestId?.farmerId?.phone})
                    </span>
                    <span>
                      Date: <strong>{app.requestId?.startDate}</strong> ({app.requestId?.durationDays}{' '}
                      {t('common.days')})
                    </span>
                    <span>
                      Wage: <strong>{formatCurrency(app.requestId?.dailyWage)}/day</strong>
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
