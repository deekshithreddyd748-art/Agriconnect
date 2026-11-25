import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  Users,
  MapPin,
  Calendar,
  Star,
  AlertTriangle,
  ArrowRight,
  Phone,
  Lock,
  BellRing,
} from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { LABOUR_CATEGORIES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/distance';
import demoData from '../../data/demoLabourData.json';

function getDemoFutureDate() {
  const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function LabourDemoPage() {
  const { t, i18n } = useTranslation();

  // Isolated in-memory state — never writes to MongoDB, backend APIs, or SMS services.
  const [step, setStep] = useState(1);
  const [request, setRequest] = useState({
    ...demoData.sampleRequestDefaults,
    startDate: getDemoFutureDate(),
  });
  // Array of accepted worker objects { ...worker, bookingCode }
  const [acceptedWorkers, setAcceptedWorkers] = useState([]);

  function resetDemo() {
    setStep(1);
    setRequest({
      ...demoData.sampleRequestDefaults,
      startDate: getDemoFutureDate(),
    });
    setAcceptedWorkers([]);
  }

  const workersRequired = Math.max(1, Number(request.workersRequired) || 1);
  const remainingVacancies = Math.max(0, workersRequired - acceptedWorkers.length);
  const estimatedTotal =
    workersRequired *
    Math.max(1, Number(request.durationDays) || 1) *
    Math.max(1, Number(request.dailyWage) || 1);

  const computedRequestStatus =
    acceptedWorkers.length === 0
      ? 'Pending'
      : remainingVacancies === 0
        ? 'Fully Filled'
        : 'Worker Accepted';

  function handleDemoWorkerAccept(worker) {
    if (acceptedWorkers.some((w) => w.id === worker.id)) return;
    if (remainingVacancies <= 0) return;
    const bookingNum = 2001 + acceptedWorkers.length;
    setAcceptedWorkers((prev) => [
      ...prev,
      { ...worker, bookingCode: `DEMO-LB-${bookingNum}` },
    ]);
  }

  function handleAutoAcceptNext() {
    const nextWorker = demoData.sampleWorkers.find(
      (w) => !acceptedWorkers.some((aw) => aw.id === w.id)
    );
    if (nextWorker && remainingVacancies > 0) {
      handleDemoWorkerAccept(nextWorker);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Isolated Demo Mode Banner */}
      <div className="rounded-3xl bg-amber-50 border-2 border-amber-300 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wider mb-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {t('demo.demoDataTag')}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {t('demo.bannerTitle')}
            </h1>
            <p className="text-sm text-slate-700 mt-0.5">{t('demo.bannerSubtitle')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={resetDemo}
            className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-sm hover:bg-amber-100"
          >
            <RotateCcw className="w-4 h-4" />
            {t('demo.resetBtn')}
          </button>
        </div>
      </div>

      {/* 6-Step Progress Bar */}
      <div className="bg-white rounded-2xl border border-earth-200 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-forest-800">
          <span>{t('demo.stepLabel', { step })}</span>
          <BookingStatusBadge status={computedRequestStatus} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStep(n)}
              className={`min-h-[46px] px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all ${
                step === n
                  ? 'bg-forest-700 text-white border-forest-700'
                  : step > n
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-earth-50 text-slate-600 border-earth-200'
              }`}
            >
              {t(`demo.step${n}Title`)}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: Farmer Creates Request */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-forest-900">{t('demo.step1Title')}</h2>
            <p className="text-sm text-slate-600 mt-0.5">{t('demo.step1Desc')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t('labourRequest.categoryLabel')}
              </label>
              <select
                value={request.category}
                onChange={(e) => setRequest({ ...request, category: e.target.value })}
                className="w-full min-h-[48px] px-3 rounded-xl border border-earth-200 text-sm font-semibold bg-white"
              >
                {LABOUR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`labourRequest.categories.${c}`, c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t('labourRequest.workersLabel')}
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={request.workersRequired}
                onChange={(e) =>
                  setRequest({
                    ...request,
                    workersRequired: Math.min(6, Math.max(1, Number(e.target.value) || 1)),
                  })
                }
                className="w-full min-h-[48px] px-3 rounded-xl border border-earth-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t('labourRequest.durationLabel')}
              </label>
              <input
                type="number"
                min="1"
                value={request.durationDays}
                onChange={(e) =>
                  setRequest({ ...request, durationDays: Math.max(1, Number(e.target.value) || 1) })
                }
                className="w-full min-h-[48px] px-3 rounded-xl border border-earth-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t('labourRequest.wageLabel')}
              </label>
              <input
                type="number"
                min="100"
                value={request.dailyWage}
                onChange={(e) =>
                  setRequest({ ...request, dailyWage: Math.max(100, Number(e.target.value) || 100) })
                }
                className="w-full min-h-[48px] px-3 rounded-xl border border-earth-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t('labourRequest.villageLabel')}
              </label>
              <input
                type="text"
                value={request.village}
                onChange={(e) => setRequest({ ...request, village: e.target.value })}
                className="w-full min-h-[48px] px-3 rounded-xl border border-earth-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t('labourRequest.startDateLabel')}
              </label>
              <input
                type="date"
                value={request.startDate}
                onChange={(e) => setRequest({ ...request, startDate: e.target.value })}
                className="w-full min-h-[48px] px-3 rounded-xl border border-earth-200 text-sm"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-forest-700">{t('demo.totalCostLabel')}</div>
              <div className="text-xs text-slate-600">
                {t('labourRequest.estimateFormula', {
                  workers: workersRequired,
                  days: request.durationDays,
                  wage: request.dailyWage,
                })}
              </div>
            </div>
            <div className="text-2xl font-extrabold text-forest-900">
              {formatCurrency(estimatedTotal, i18n.language)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="min-h-[48px] px-6 inline-flex items-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm"
          >
            {t('demo.publishRequestBtn')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Request Published (Pending) */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-forest-900">{t('demo.step2Title')}</h2>
              <p className="text-sm text-slate-600 mt-0.5">{t('demo.step2Desc')}</p>
            </div>
            <BookingStatusBadge status={computedRequestStatus} />
          </div>

          <div className="p-5 rounded-2xl bg-earth-50 border border-earth-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">{t('demo.demoRequestId')}</div>
              <div className="font-mono font-bold text-forest-900">{request.requestCode}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">{t('labourRequest.categoryLabel')}</div>
              <div className="font-bold text-slate-900">
                {t(`labourRequest.categories.${request.category}`, request.category)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">{t('demo.vacanciesLeftLabel')}</div>
              <div className="font-bold text-forest-800">
                {remainingVacancies} / {workersRequired}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">{t('demo.totalCostLabel')}</div>
              <div className="font-extrabold text-forest-900">
                {formatCurrency(estimatedTotal, i18n.language)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(3)}
            className="min-h-[48px] px-6 inline-flex items-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm"
          >
            <BellRing className="w-4 h-4" />
            {t('demo.notifyWorkersBtn')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 3: Nearby Workers Receive Notification */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-forest-900">{t('demo.step3Title')}</h2>
              <p className="text-sm text-slate-600 mt-0.5">{t('demo.step3Desc')}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-forest-700 text-white text-xs sm:text-sm font-bold"
            >
              {t('auth.continue')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoData.sampleWorkers.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-2xl border border-earth-200 bg-earth-50/70 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-forest-700 text-white font-bold text-xs flex items-center justify-center">
                      {w.initials}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{w.name}</div>
                      <div className="text-xs text-slate-500">{w.village}</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {w.rating}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap gap-1">
                  {w.skillKeys.map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 rounded bg-white border border-earth-200 font-medium"
                    >
                      {t(`labourRequest.categories.${sk}`, sk)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <Lock className="w-3 h-3" />
                  <span>{t('worker.contactHiddenHint')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: Workers Accept Request Directly */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-forest-900">{t('demo.step4Title')}</h2>
              <p className="text-sm text-slate-600 mt-0.5">{t('demo.step4Desc')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={remainingVacancies === 0}
                onClick={handleAutoAcceptNext}
                className="min-h-[42px] px-4 rounded-xl bg-harvest-600 hover:bg-harvest-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {t('demo.autoFillBtn')}
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="min-h-[42px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-forest-700 text-white text-xs font-bold"
              >
                {t('auth.continue')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-200 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-forest-900">
            <span>
              {t('demo.selectedWorkersLabel')}: {acceptedWorkers.length} / {workersRequired}
            </span>
            <span>
              {t('demo.vacanciesLeftLabel')}: {remainingVacancies}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoData.sampleWorkers.map((w) => {
              const accepted = acceptedWorkers.some((aw) => aw.id === w.id);
              return (
                <div
                  key={w.id}
                  className={`p-4 rounded-2xl border-2 space-y-3 ${
                    accepted
                      ? 'border-emerald-300 bg-emerald-50/70'
                      : 'border-earth-200 bg-earth-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-forest-700 text-white font-bold text-xs flex items-center justify-center">
                        {w.initials}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{w.name}</div>
                        <div className="text-xs text-slate-500">{w.village}</div>
                      </div>
                    </div>
                    {accepted && <BookingStatusBadge status="Worker Accepted" />}
                  </div>

                  <button
                    type="button"
                    disabled={accepted || remainingVacancies === 0}
                    onClick={() => handleDemoWorkerAccept(w)}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {accepted ? t('demo.acceptedWorkerBadge') : t('demo.workerAcceptBtn')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: Farmer Views Accepted Workers & Remaining Vacancies */}
      {step === 5 && (
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-forest-900">{t('demo.step5Title')}</h2>
              <p className="text-sm text-slate-600 mt-0.5">{t('demo.step5Desc')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-bold">
                {acceptedWorkers.length} / {workersRequired} {t('common.workers')}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
                {t('labourRequest.remainingVacancies', { count: remainingVacancies })}
              </span>
            </div>
          </div>

          {acceptedWorkers.length === 0 ? (
            <div className="p-6 rounded-2xl bg-earth-50 border border-earth-200 text-center space-y-3">
              <p className="text-sm text-slate-600">{t('labourRequest.noConfirmedWorkers')}</p>
              <button
                type="button"
                onClick={handleAutoAcceptNext}
                className="min-h-[42px] px-4 rounded-xl bg-forest-700 text-white text-xs font-bold"
              >
                {t('demo.autoFillBtn')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {acceptedWorkers.map((w) => (
                <div
                  key={w.id}
                  className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      {t('demo.demoBookingId')}: {w.bookingCode}
                    </div>
                    <div className="font-bold text-slate-900">{w.name}</div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 mt-0.5">
                      <span>{w.village}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-forest-800">
                        <Phone className="w-3.5 h-3.5" /> {w.phone}
                      </span>
                    </div>
                  </div>
                  <BookingStatusBadge status="Accepted" />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep(6)}
            className="min-h-[48px] px-6 inline-flex items-center gap-2 rounded-xl bg-forest-700 text-white font-bold text-sm"
          >
            {t('demo.viewConfirmationBtn')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 6: Booking Confirmation */}
      {step === 6 && (
        <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-forest-900">
                  {t('demo.step6Title')}
                </h2>
                <p className="text-sm text-slate-600">{t('demo.step6Desc')}</p>
              </div>
            </div>
            <BookingStatusBadge status={computedRequestStatus} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-earth-50 border border-earth-200">
            <div className="space-y-2 text-sm">
              <div className="font-bold text-lg text-forest-900">
                {t(`labourRequest.categories.${request.category}`, request.category)}
              </div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {formatDate(request.startDate, i18n.language)} (
                {request.durationDays} {t('common.days')})
              </div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {request.village}
              </div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {t('demo.selectedWorkersLabel')}:{' '}
                <strong>
                  {acceptedWorkers.length} / {workersRequired}
                </strong>
              </div>
            </div>

            <div className="flex flex-col justify-between items-start md:items-end">
              <div className="text-xs text-slate-500">{t('demo.totalCostLabel')}</div>
              <div className="text-3xl font-extrabold text-forest-900">
                {formatCurrency(estimatedTotal, i18n.language)}
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-1">
                {t('demo.demoDataTag')}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetDemo}
              className="min-h-[48px] px-5 inline-flex items-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              {t('demo.replayBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
