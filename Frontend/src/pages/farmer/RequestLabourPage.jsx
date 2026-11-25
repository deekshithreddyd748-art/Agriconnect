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
  Shovel,
  PackagePlus,
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
  Play,
  Flag,
  Edit3,
  Ruler,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { BookingStatusBadge } from '../../components/StatusBadge';
import CurrentLocationPicker from '../../components/location/CurrentLocationPicker';
import { formatCurrency, formatDate } from '../../utils/distance';

const LABOUR_CATEGORIES_META = [
  { id: 'Sowing / Planting', icon: Sprout },
  { id: 'Transplanting', icon: Sprout },
  { id: 'Weeding', icon: Scissors },
  { id: 'Harvesting', icon: Wheat },
  { id: 'Pesticide Spraying', icon: SprayCan },
  { id: 'Tractor / Machinery Operator', icon: Tractor },
  { id: 'Irrigation Work', icon: Droplets },
  { id: 'Land Preparation', icon: Shovel },
  { id: 'Fertilizer Application', icon: PackagePlus },
  { id: 'General Farm Help', icon: Users },
  { id: 'Other Agricultural Work', icon: Wrench },
];

const EDITABLE_STATUSES = ['Open', 'Pending', 'Applications Received'];

function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function RequestLabourPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { coords, hasCoords, location: contextLocation } = useLocationContext();

  const [editingRequestId, setEditingRequestId] = useState(null);
  const [category, setCategory] = useState('Harvesting');
  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  const [workersRequired, setWorkersRequired] = useState(5);
  const [startDate, setStartDate] = useState(getTodayDateStr());
  const [durationDays, setDurationDays] = useState(2);
  const [dailyWage, setDailyWage] = useState('500');
  const [budget, setBudget] = useState('');
  const [farmSize, setFarmSize] = useState(user?.farmSize ? String(user.farmSize) : '');
  const [farmSizeUnit, setFarmSizeUnit] = useState(user?.farmSizeUnit || 'acres');
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
  const [confirmedBookings, setConfirmedBookings] = useState([]);
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
  const parsedDays = Math.max(1, Number(durationDays) || 1);
  const parsedWage = Math.max(0, Number(dailyWage) || 0);
  const parsedBudget = Math.max(0, Number(budget) || 0);
  const estimatedTotal =
    parsedWage > 0
      ? Math.round(parsedWorkers * parsedDays * parsedWage * 100) / 100
      : Math.round(parsedBudget * 100) / 100;

  function fetchMyRequests() {
    setLoadingList(true);
    Promise.all([
      api.get('/farmer/labour-requests'),
      api.get('/labour-requests/farmer/bookings'),
    ])
      .then(([reqRes, bookingsRes]) => {
        setRequests(reqRes.data.data || []);
        setConfirmedBookings(bookingsRes.data.data || []);
      })
      .catch(() => {
        setRequests([]);
        setConfirmedBookings([]);
      })
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

  function startEditRequest(req) {
    setEditingRequestId(req._id);
    setCategory(req.category || 'Harvesting');
    setWorkersRequired(req.workersRequired || 1);
    setStartDate(req.startDate || getTodayDateStr());
    setDurationDays(req.durationDays || 1);
    setDailyWage(req.dailyWage ? String(req.dailyWage) : '');
    setBudget(req.budget !== null && req.budget !== undefined ? String(req.budget) : '');
    setFarmSize(req.farmSize !== null && req.farmSize !== undefined ? String(req.farmSize) : '');
    setFarmSizeUnit(req.farmSizeUnit || 'acres');
    setVillage(req.location?.village || '');
    setDistrict(req.location?.district || '');
    setInstructions(req.instructions || '');
    setPreferredHours(req.preferredHours || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetFormToCreate() {
    setEditingRequestId(null);
    setInstructions('');
    setBudget('');
    setWorkersRequired(5);
    setDailyWage('500');
    setStartDate(getTodayDateStr());
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
    if (dailyWage !== '' && Number(dailyWage) < 0) {
      return toast.error(t('labourRequest.validation.wage'));
    }
    if (!village.trim()) {
      return toast.error(t('labourRequest.validation.village'));
    }

    const payload = {
      category,
      workersRequired: Number(workersRequired),
      startDate,
      durationDays: Number(durationDays),
      dailyWage: dailyWage === '' ? 0 : Number(dailyWage),
      budget: budget === '' ? null : Number(budget),
      farmSize: farmSize === '' ? null : Number(farmSize),
      farmSizeUnit,
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
    };

    setSubmitting(true);
    try {
      if (editingRequestId) {
        await api.put(`/labour-requests/${editingRequestId}`, payload);
        toast.success(t('labourRequest.updatedMsg'));
        resetFormToCreate();
      } else {
        const res = await api.post('/labour-requests', payload);
        setCreatedNotice(res.data.data);
        toast.success(t('labourRequest.successTitle'));
        setInstructions('');
      }
      fetchMyRequests();
    } catch (err) {
      toast.error(getErrorMessage(err, t('labourRequest.postFailed')));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelRequest(id) {
    if (!window.confirm(t('labourRequest.confirmCancel'))) return;
    try {
      await api.patch(`/labour-requests/${id}/cancel`);
      toast.success(t('labourRequest.cancelledMsg'));
      if (editingRequestId === id) resetFormToCreate();
      fetchMyRequests();
    } catch (err) {
      toast.error(getErrorMessage(err, t('labourRequest.cancelFailed')));
    }
  }

  async function handleReviewApplication(appId, status) {
    try {
      const action = status === 'Accepted' ? 'accept' : 'reject';
      await api.patch(`/labour-applications/${appId}/${action}`);
      toast.success(t('labourRequest.bookingUpdatedMsg', { status: t(`statuses.${status}`, status) }));
      fetchMyRequests();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    }
  }

  async function handleUpdateBookingStatus(bookingId, bookingStatus) {
    try {
      await api.patch(`/labour-requests/bookings/${bookingId}/status`, {
        bookingStatus,
      });
      toast.success(
        t('labourRequest.bookingUpdatedMsg', {
          status: t(`statuses.${bookingStatus}`, bookingStatus),
        })
      );
      fetchMyRequests();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
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

      {createdNotice && !editingRequestId && (
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
        {/* Create / Edit Request Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
                {editingRequestId
                  ? t('labourRequest.editRequestBtn')
                  : t('labourRequest.title')}
              </h1>
              <p className="text-sm text-slate-600 mt-1">{t('labourRequest.subtitle')}</p>
            </div>
            {editingRequestId && (
              <button
                type="button"
                onClick={resetFormToCreate}
                className="px-3 min-h-[38px] rounded-xl border border-earth-200 text-xs font-bold text-slate-600 hover:bg-earth-50"
              >
                {t('common.cancel')}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Searchable Work Type Dropdown */}
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
                  <div className="max-h-64 overflow-y-auto space-y-1">
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
                  {t('labourRequest.wageLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 text-base font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('labourRequest.budgetLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-earth-200 text-base"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800 mb-1.5">
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
                    className="flex-1 min-h-[48px] px-4 rounded-xl border-2 border-earth-200 text-base"
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

            <CurrentLocationPicker
              title={t('labourRequest.locationCaptureTitle')}
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
                  placeholder={t('labourRequest.villagePlaceholder')}
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
                  placeholder={t('labourRequest.districtPlaceholder')}
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
                  {formatCurrency(estimatedTotal, i18n.language)}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[52px] rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base shadow-sm transition-colors disabled:opacity-60"
            >
              {submitting
                ? t('labourRequest.postingBtn')
                : editingRequestId
                  ? t('labourRequest.saveEditBtn')
                  : t('labourRequest.postBtn')}
            </button>
          </form>
        </div>

        {/* My Labour Requests, Applications & Confirmed Bookings */}
        <div id="my-requests" className="lg:col-span-5 space-y-4">
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
              {requests.map((req) => {
                const reqBookings = confirmedBookings.filter(
                  (b) => (b.labourRequestId?._id || b.labourRequestId) === req._id
                );
                const remaining =
                  req.remainingVacancies !== undefined
                    ? req.remainingVacancies
                    : Math.max(0, req.workersRequired - req.workersAccepted);

                return (
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
                        <Calendar className="w-3.5 h-3.5" />{' '}
                        {formatDate(req.startDate, i18n.language)} ({req.durationDays}{' '}
                        {t('common.days')})
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {req.location?.village}
                      </span>
                      <span className="font-semibold text-forest-800">
                        {t('labourRequest.workersFilled', {
                          accepted: req.workersAccepted,
                          required: req.workersRequired,
                          remaining,
                        })}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(req.estimatedTotal || req.budget || 0, i18n.language)}
                      </span>
                    </div>

                    {req.farmSize ? (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5" /> {req.farmSize}{' '}
                        {t(`auth.${req.farmSizeUnit || 'acres'}`)}
                      </div>
                    ) : null}

                    {req.preferredHours && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {req.preferredHours}
                      </div>
                    )}

                    {/* Confirmed Workers (LabourBooking) */}
                    <div className="pt-3 border-t border-earth-200 space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-forest-700">
                        {t('labourRequest.confirmedWorkersTitle')} ({reqBookings.length})
                      </div>
                      {reqBookings.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          {t('labourRequest.noConfirmedWorkers')}
                        </p>
                      ) : (
                        reqBookings.map((bk) => (
                          <div
                            key={bk._id}
                            className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-[11px] font-mono text-slate-500">
                                  {bk.bookingCode}
                                </div>
                                <div className="font-bold text-sm text-slate-900">
                                  {bk.workerId?.name}
                                </div>
                                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                                  <span>
                                    {[bk.workerId?.village, bk.workerId?.district]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </span>
                                  {bk.workerId?.phone && (
                                    <span className="inline-flex items-center gap-0.5 text-forest-800 font-semibold">
                                      <Phone className="w-3 h-3" /> {bk.workerId.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <BookingStatusBadge status={bk.bookingStatus} />
                            </div>

                            {['Accepted', 'In Progress'].includes(bk.bookingStatus) && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {bk.bookingStatus === 'Accepted' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateBookingStatus(bk._id, 'In Progress')
                                    }
                                    className="px-2.5 min-h-[34px] inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                                  >
                                    <Play className="w-3 h-3" />
                                    {t('labourRequest.startWorkBtn')}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateBookingStatus(bk._id, 'Completed')
                                  }
                                  className="px-2.5 min-h-[34px] inline-flex items-center gap-1 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold"
                                >
                                  <Flag className="w-3 h-3" />
                                  {t('labourRequest.completeWorkBtn')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateBookingStatus(bk._id, 'Cancelled')
                                  }
                                  className="px-2.5 min-h-[34px] inline-flex items-center gap-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                                >
                                  {t('labourRequest.cancelBookingBtn')}
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Applications */}
                    {req.applications?.length > 0 && (
                      <div className="pt-3 border-t border-earth-200 space-y-2.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t('labourRequest.applicationsTitle')} ({req.applications.length})
                        </div>
                        {req.applications.map((app) => (
                          <div
                            key={app._id}
                            className="p-3 rounded-xl bg-earth-50 border border-earth-200 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-sm text-slate-900">
                                  {app.workerName}
                                </div>
                                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                                  <span>{app.workerVillage}</span>
                                  <span>
                                    ({app.numberOfWorkers || 1} {t('common.workers')})
                                  </span>
                                  {app.workerPhone && (
                                    <span className="inline-flex items-center gap-0.5 text-forest-700 font-semibold">
                                      <Phone className="w-3 h-3" /> {app.workerPhone}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <BookingStatusBadge status={app.status} />
                            </div>

                            {app.status === 'Pending' &&
                              [
                                'Open',
                                'Applications Received',
                                'Pending',
                                'Worker Accepted',
                                'Partially Filled',
                              ].includes(req.status) && (
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleReviewApplication(app._id, 'Accepted')
                                    }
                                    className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {t('labourRequest.acceptWorker')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleReviewApplication(app._id, 'Rejected')
                                    }
                                    className="px-3 min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    {t('labourRequest.rejectWorker')}
                                  </button>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {EDITABLE_STATUSES.includes(req.status) && (
                        <button
                          type="button"
                          onClick={() => startEditRequest(req)}
                          className="min-h-[40px] px-3 inline-flex items-center gap-1 rounded-xl border border-forest-200 text-forest-800 hover:bg-forest-50 text-xs font-semibold"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {t('labourRequest.editRequestBtn')}
                        </button>
                      )}
                      {['Open', 'Applications Received', 'Pending', 'Worker Accepted', 'Partially Filled'].includes(
                        req.status
                      ) && (
                        <button
                          type="button"
                          onClick={() => handleCancelRequest(req._id)}
                          className="min-h-[40px] px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                        >
                          {t('labourRequest.cancelBtn')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
