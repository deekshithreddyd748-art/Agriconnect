import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Sprout,
  Wheat,
  Scissors,
  SprayCan,
  Tractor,
  Droplets,
  Users,
  Wrench,
  Search,
  ChevronDown,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Phone,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { BookingStatusBadge } from '../../components/StatusBadge';
import CurrentLocationPicker from '../../components/location/CurrentLocationPicker';
import { formatCurrency } from '../../utils/distance';

const LABOUR_CATEGORIES_META = [
  { id: 'Sowing / Planting', icon: Sprout },
  { id: 'Harvesting', icon: Wheat },
  { id: 'Weeding', icon: Scissors },
  { id: 'Pesticide Spraying', icon: SprayCan },
  { id: 'Tractor / Machinery Operator', icon: Tractor },
  { id: 'Irrigation Work', icon: Droplets },
  { id: 'General Farm Help', icon: Users },
  { id: 'Other', icon: Wrench },
];

function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function RequestLabourPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { coords, hasCoords, location: contextLocation } = useLocationContext();

  const [category, setCategory] = useState('Harvesting');
  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  const [workersRequired, setWorkersRequired] = useState(5);
  const [startDate, setStartDate] = useState(getTodayDateStr());
  const [durationDays, setDurationDays] = useState(2);
  const [dailyWage, setDailyWage] = useState(500);
  const [village, setVillage] = useState(user?.village || contextLocation?.village || '');
  const [district, setDistrict] = useState(user?.district || contextLocation?.district || '');
  const [requestGpsCoords, setRequestGpsCoords] = useState(
    hasCoords
      ? coords
      : user?.location?.lat !== null && user?.location?.lng !== null
        ? { lat: user?.location?.lat, lng: user?.location?.lng }
        : null
  );
  const [instructions, setInstructions] = useState('');
  const [preferredHours, setPreferredHours] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdNotice, setCreatedNotice] = useState(null);

  const [requests, setRequests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const filteredCategories = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    if (!q) return LABOUR_CATEGORIES_META;
    return LABOUR_CATEGORIES_META.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        t(`labourRequest.categories.${c.id}`, c.id).toLowerCase().includes(q)
    );
  }, [catSearch, t]);

  const selectedCatMeta =
    LABOUR_CATEGORIES_META.find((c) => c.id === category) || LABOUR_CATEGORIES_META[0];
  const SelectedCatIcon = selectedCatMeta.icon;

  const parsedWorkers = Math.max(0, Number(workersRequired) || 0);
  const parsedDays = Math.max(0, Number(durationDays) || 0);
  const parsedWage = Math.max(0, Number(dailyWage) || 0);
  const estimatedTotal = Math.round(parsedWorkers * parsedDays * parsedWage * 100) / 100;

  function fetchMyRequests() {
    setLoadingList(true);
    api
      .get('/labour-requests', { params: { mine: 'true' } })
      .then((res) => setRequests(res.data.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoadingList(false));
  }

  useEffect(() => {
    fetchMyRequests();
  }, []);

  function handleGpsCaptured(loc) {
    setRequestGpsCoords({ lat: loc.lat, lng: loc.lng });
    if (loc.village) setVillage(loc.village);
    if (loc.district) setDistrict(loc.district);
  }

  function handleRegionFallback(region) {
    setVillage(region.village);
    setDistrict(region.district);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!category) return toast.error(t('labourRequest.validation.category'));
    if (!Number.isInteger(Number(workersRequired)) || Number(workersRequired) < 1) {
      return toast.error(t('labourRequest.validation.workers'));
    }
    if (!startDate || startDate < getTodayDateStr()) {
      return toast.error(t('labourRequest.validation.startDatePast'));
    }
    if (Number(durationDays) <= 0) {
      return toast.error(t('labourRequest.validation.duration'));
    }
    if (Number(dailyWage) <= 0) {
      return toast.error(t('labourRequest.validation.wage'));
    }
    if (!village.trim()) {
      return toast.error(t('labourRequest.validation.village'));
    }

    setSubmitting(true);
    try {
      const res = await api.post('/labour-requests', {
        category,
        workersRequired: Number(workersRequired),
        startDate,
        durationDays: Number(durationDays),
        dailyWage: Number(dailyWage),
        village: village.trim(),
        district: district.trim(),
        state: user?.state || '',
        location: {
          village: village.trim(),
          district: district.trim(),
          state: user?.state || '',
          lat: requestGpsCoords?.lat ?? null,
          lng: requestGpsCoords?.lng ?? null,
        },
        instructions: instructions.trim(),
        preferredHours: preferredHours.trim(),
      });

      setCreatedNotice(res.data.data);
      toast.success(t('labourRequest.successTitle'));
      setInstructions('');
      fetchMyRequests();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not post labour request.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelRequest(id) {
    if (!window.confirm(t('labourRequest.confirmCancel'))) return;
    try {
      await api.patch(`/labour-requests/${id}/cancel`);
      toast.success('Request cancelled.');
      fetchMyRequests();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel request.'));
    }
  }

  async function handleReviewApplication(requestId, appId, status) {
    try {
      await api.patch(`/labour-requests/${requestId}/applications/${appId}`, {
        status,
      });
      toast.success(`Worker ${status.toLowerCase()}.`);
      fetchMyRequests();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update application.'));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/farmer/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> {t('nav.dashboard')}
      </Link>

      {createdNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-emerald-900">{t('labourRequest.successTitle')}</h3>
            <p className="text-sm text-emerald-800 mt-0.5">
              {t('labourRequest.successDesc', { code: createdNotice.requestCode })}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Request Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
              {t('labourRequest.title')}
            </h1>
            <p className="text-sm text-slate-600 mt-1">{t('labourRequest.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Searchable Labour Category Dropdown */}
            <div className="relative">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                {t('labourRequest.categoryLabel')} *
              </label>
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
                className="w-full min-h-[50px] px-4 rounded-xl border-2 border-earth-200 bg-white flex items-center justify-between text-left font-semibold text-slate-900"
              >
                <span className="inline-flex items-center gap-2.5">
                  <SelectedCatIcon className="w-5 h-5 text-forest-700" />
                  {t(`labourRequest.categories.${category}`, category)}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {catOpen && (
                <div className="absolute z-30 mt-1.5 w-full bg-white rounded-2xl border border-earth-200 shadow-xl p-2 space-y-1.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      placeholder={t('labourRequest.searchCategory')}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-earth-200 text-sm"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {filteredCategories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.id);
                            setCatOpen(false);
                            setCatSearch('');
                          }}
                          className={`w-full min-h-[44px] px-3 rounded-xl flex items-center gap-2.5 text-sm font-semibold text-left transition-colors ${
                            category === cat.id
                              ? 'bg-forest-50 text-forest-800'
                              : 'hover:bg-earth-50 text-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-forest-700 shrink-0" />
                          <span>{t(`labourRequest.categories.${cat.id}`, cat.id)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('labourRequest.workersLabel')} *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={workersRequired}
                  onChange={(e) => setWorkersRequired(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 text-base font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('labourRequest.startDateLabel')} *
                </label>
                <input
                  type="date"
                  min={getTodayDateStr()}
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('labourRequest.durationLabel')} *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 text-base font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('labourRequest.wageLabel')} *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 text-base font-semibold"
                />
              </div>
            </div>

            <CurrentLocationPicker
              title="Work Farm GPS Location"
              initialLocation={{
                lat: requestGpsCoords?.lat,
                lng: requestGpsCoords?.lng,
                village,
                district,
                state: user?.state,
                address: user?.location?.address,
              }}
              onLocationCaptured={handleGpsCaptured}
              onRegionFallbackChange={handleRegionFallback}
              compact
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('labourRequest.villageLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('labourRequest.districtLabel')}
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('labourRequest.hoursLabel')}
                </label>
                <input
                  type="text"
                  value={preferredHours}
                  onChange={(e) => setPreferredHours(e.target.value)}
                  placeholder={t('labourRequest.hoursPlaceholder')}
                  className="w-full min-h-[48px] px-4 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('labourRequest.instructionsLabel')}
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t('labourRequest.instructionsPlaceholder')}
                  className="w-full min-h-[48px] px-4 rounded-xl border border-earth-200 text-sm"
                />
              </div>
            </div>

            {/* Review Summary & Live Estimate */}
            <div className="p-5 rounded-2xl bg-forest-50 border border-forest-200 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-forest-700">
                {t('labourRequest.reviewSummary')}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-forest-900">
                    {t('labourRequest.estimatedTotal')}
                  </div>
                  <div className="text-xs text-forest-700">
                    {t('labourRequest.estimateFormula', {
                      workers: parsedWorkers,
                      days: parsedDays,
                      wage: parsedWage,
                    })}
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-forest-900">
                  {formatCurrency(estimatedTotal)}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[52px] rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base shadow-sm transition-colors disabled:opacity-60"
            >
              {submitting ? t('labourRequest.postingBtn') : t('labourRequest.postBtn')}
            </button>
          </form>
        </div>

        {/* My Labour Requests & Worker Applications */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-extrabold text-forest-900">
            {t('labourRequest.myRequestsTitle')}
          </h2>

          {loadingList ? (
            <div className="p-8 bg-white rounded-2xl border border-earth-200 text-center text-sm text-slate-500">
              {t('common.loading')}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-earth-200 text-center text-sm text-slate-500">
              {t('dashboard.noLabourRequests')}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {t('labourRequest.requestId')}: {req.requestCode}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">
                        {t(`labourRequest.categories.${req.category}`, req.category)}
                      </h3>
                    </div>
                    <BookingStatusBadge status={req.status} />
                  </div>

                  <div className="text-xs text-slate-600 grid grid-cols-2 gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {req.startDate} ({req.durationDays}{' '}
                      {t('common.days')})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {req.location?.village}
                    </span>
                    <span className="font-semibold text-forest-800">
                      {t('labourRequest.workersFilled', {
                        accepted: req.workersAccepted,
                        required: req.workersRequired,
                      })}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(req.dailyWage)} {t('common.perDay')} · Est.{' '}
                      {formatCurrency(req.estimatedTotal)}
                    </span>
                  </div>

                  {req.preferredHours && (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {req.preferredHours}
                    </div>
                  )}

                  {/* Applications */}
                  <div className="pt-3 border-t border-earth-200 space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t('labourRequest.applicationsTitle')} ({req.applications?.length || 0})
                    </div>
                    {!req.applications || req.applications.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        {t('labourRequest.noApplications')}
                      </p>
                    ) : (
                      req.applications.map((app) => (
                        <div
                          key={app._id}
                          className="p-3 rounded-xl bg-earth-50 border border-earth-200 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-sm text-slate-900">
                                {app.workerName}
                              </div>
                              <div className="text-xs text-slate-600 flex items-center gap-2">
                                <span>{app.workerVillage}</span>
                                {app.workerPhone && (
                                  <span className="inline-flex items-center gap-0.5 text-forest-700 font-semibold">
                                    <Phone className="w-3 h-3" /> {app.workerPhone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <BookingStatusBadge status={app.status} />
                          </div>

                          {app.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {app.skills.map((sk) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 rounded bg-white border border-earth-200 text-[11px] font-medium"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}

                          {app.status === 'Pending' &&
                            ['Open', 'Partially Filled'].includes(req.status) && (
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReviewApplication(req._id, app._id, 'Accepted')
                                  }
                                  className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {t('labourRequest.acceptWorker')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReviewApplication(req._id, app._id, 'Rejected')
                                  }
                                  className="px-3 min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  {t('labourRequest.rejectWorker')}
                                </button>
                              </div>
                            )}
                        </div>
                      ))
                    )}
                  </div>

                  {['Open', 'Partially Filled'].includes(req.status) && (
                    <button
                      type="button"
                      onClick={() => handleCancelRequest(req._id)}
                      className="min-h-[40px] px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                    >
                      {t('labourRequest.cancelBtn')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
