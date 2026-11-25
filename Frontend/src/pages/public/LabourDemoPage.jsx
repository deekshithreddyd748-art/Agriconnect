import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  Calendar,
  Star,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { formatCurrency } from '../../utils/distance';

const SAMPLE_WORKERS = [
  {
    id: 'demo-w1',
    name: 'Ramesh Kale',
    initials: 'RK',
    village: 'Malegaon Bk',
    skills: ['Harvesting', 'Crop Bundling'],
    experience: '7 years',
    availability: 'Available',
    rating: '4.9 (Demo)',
  },
  {
    id: 'demo-w2',
    name: 'Sunita Pawar',
    initials: 'SP',
    village: 'Pandare',
    skills: ['Harvesting', 'Weeding'],
    experience: '5 years',
    availability: 'Available',
    rating: '4.8 (Demo)',
  },
  {
    id: 'demo-w3',
    name: 'Ganesh Bhosale',
    initials: 'GB',
    village: 'Katphal',
    skills: ['Harvesting', 'Loading'],
    experience: '6 years',
    availability: 'Available',
    rating: '4.7 (Demo)',
  },
  {
    id: 'demo-w4',
    name: 'Anjali Jadhav',
    initials: 'AJ',
    village: 'Sangavi',
    skills: ['Harvesting', 'Sowing'],
    experience: '4 years',
    availability: 'Available',
    rating: '4.8 (Demo)',
  },
  {
    id: 'demo-w5',
    name: 'Prakash More',
    initials: 'PM',
    village: 'Baramati',
    skills: ['Harvesting', 'Tractor Help'],
    experience: '9 years',
    availability: 'Available',
    rating: '5.0 (Demo)',
  },
];

function getDemoFutureDate() {
  const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function LabourDemoPage() {
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [request, setRequest] = useState({
    category: 'Harvesting',
    workersRequired: 5,
    startDate: getDemoFutureDate(),
    durationDays: 3,
    dailyWage: 500,
    village: 'Baramati, Pune',
  });

  // Map workerId -> 'Pending' | 'Accepted' | 'Rejected'
  const [applications, setApplications] = useState({});

  function resetDemo() {
    setStep(1);
    setRequest({
      category: 'Harvesting',
      workersRequired: 5,
      startDate: getDemoFutureDate(),
      durationDays: 3,
      dailyWage: 500,
      village: 'Baramati, Pune',
    });
    setApplications({});
  }

  function applySampleWorker(workerId) {
    setApplications((prev) => ({
      ...prev,
      [workerId]: prev[workerId] || 'Pending',
    }));
  }

  function autoApplyWorkers() {
    const next = {};
    SAMPLE_WORKERS.slice(0, 4).forEach((w) => {
      next[w.id] = applications[w.id] || 'Pending';
    });
    setApplications((prev) => ({ ...next, ...prev }));
    setStep(4);
  }

  function reviewWorker(workerId, status) {
    const acceptedCount = Object.values(applications).filter(
      (s) => s === 'Accepted'
    ).length;
    if (status === 'Accepted' && acceptedCount >= Number(request.workersRequired)) {
      return;
    }
    setApplications((prev) => ({ ...prev, [workerId]: status }));
  }

  const appliedWorkers = SAMPLE_WORKERS.filter((w) => applications[w.id]);
  const acceptedWorkers = SAMPLE_WORKERS.filter(
    (w) => applications[w.id] === 'Accepted'
  );
  const totalEstimatedCost =
    Number(request.workersRequired || 0) *
    Number(request.durationDays || 0) *
    Number(request.dailyWage || 0);

  const acceptedTotalCost =
    acceptedWorkers.length *
    Number(request.durationDays || 0) *
    Number(request.dailyWage || 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Isolated Demo Mode Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold text-amber-950 text-sm sm:text-base">
              {t('demo.bannerTitle')}
            </div>
            <p className="text-xs sm:text-sm text-amber-900 mt-0.5">
              {t('demo.bannerSubtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={resetDemo}
            className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            {t('demo.resetBtn')}
          </button>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: '1. Post' },
          { num: 2, label: '2–3. Apply' },
          { num: 4, label: '4. Review' },
          { num: 5, label: '5. Confirm' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-bold border transition-colors ${
              step === s.num
                ? 'bg-forest-700 text-white border-forest-700'
                : 'bg-white text-slate-700 border-earth-200 hover:bg-earth-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* STEP 1: SAMPLE FARMER REQUEST */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-forest-900 flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-forest-700" />
            {t('demo.step1Title')}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('labourRequest.categoryLabel')}
              </label>
              <input
                type="text"
                value={request.category}
                onChange={(e) => setRequest({ ...request, category: e.target.value })}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-earth-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('labourRequest.workersLabel')}
              </label>
              <input
                type="number"
                min="1"
                value={request.workersRequired}
                onChange={(e) =>
                  setRequest({ ...request, workersRequired: Number(e.target.value) })
                }
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-earth-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('labourRequest.startDateLabel')}
              </label>
              <input
                type="date"
                value={request.startDate}
                onChange={(e) => setRequest({ ...request, startDate: e.target.value })}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('labourRequest.durationLabel')}
              </label>
              <input
                type="number"
                min="1"
                value={request.durationDays}
                onChange={(e) =>
                  setRequest({ ...request, durationDays: Number(e.target.value) })
                }
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-earth-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('labourRequest.wageLabel')}
              </label>
              <input
                type="number"
                min="1"
                value={request.dailyWage}
                onChange={(e) =>
                  setRequest({ ...request, dailyWage: Number(e.target.value) })
                }
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-earth-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('labourRequest.villageLabel')}
              </label>
              <input
                type="text"
                value={request.village}
                onChange={(e) => setRequest({ ...request, village: e.target.value })}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 flex items-center justify-between">
            <span className="text-sm font-bold text-forest-900">
              {t('demo.totalCostLabel')}
            </span>
            <span className="text-2xl font-extrabold text-forest-900">
              {formatCurrency(totalEstimatedCost)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base"
          >
            {t('demo.postSampleBtn')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STEP 2 & 3: SAMPLE WORKER PROFILES & SIMULATED APPLY */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-forest-900">
              {t('demo.step2Title')}
            </h2>
            <button
              type="button"
              onClick={autoApplyWorkers}
              className="min-h-[44px] px-4 rounded-xl bg-harvest-600 hover:bg-harvest-700 text-white text-xs font-bold"
            >
              {t('demo.autoApplyBtn')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_WORKERS.map((w) => {
              const applied = Boolean(applications[w.id]);
              return (
                <div
                  key={w.id}
                  className="p-4 rounded-2xl border border-earth-200 bg-earth-50 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-forest-700 text-white font-bold flex items-center justify-center shrink-0">
                        {w.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{w.name}</div>
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {w.village} · {w.experience}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center gap-1">
                      <Star className="w-3 h-3" /> {w.rating}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white border border-earth-200 text-[10px] font-bold text-slate-500">
                      {t('demo.demoDataTag')}
                    </span>
                    {w.skills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded bg-forest-50 text-forest-800 text-[11px] font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={applied}
                    onClick={() => applySampleWorker(w.id)}
                    className={`w-full min-h-[44px] rounded-xl text-xs font-bold transition-colors ${
                      applied
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-forest-700 hover:bg-forest-800 text-white'
                    }`}
                  >
                    {applied ? t('demo.appliedBadge') : t('demo.applyBtn')}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setStep(4)}
            disabled={appliedWorkers.length === 0}
            className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base disabled:opacity-50"
          >
            {t('demo.step4Title')} ({appliedWorkers.length})
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STEP 4: FARMER REVIEWS APPLICATIONS */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-forest-900">
              {t('demo.step4Title')}
            </h2>
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-bold">
              {acceptedWorkers.length} / {request.workersRequired} {t('common.workers')}
            </span>
          </div>

          {appliedWorkers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-600 space-y-3">
              <p>No simulated worker applications yet.</p>
              <button
                type="button"
                onClick={autoApplyWorkers}
                className="min-h-[44px] px-4 rounded-xl bg-forest-700 text-white text-xs font-bold"
              >
                {t('demo.autoApplyBtn')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appliedWorkers.map((w) => {
                const status = applications[w.id];
                return (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl border border-earth-200 bg-earth-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-forest-700 text-white font-bold flex items-center justify-center">
                        {w.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{w.name}</div>
                        <div className="text-xs text-slate-600">
                          {w.village} · {w.skills.join(', ')} · {w.rating}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {status === 'Pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => reviewWorker(w.id, 'Accepted')}
                            className="min-h-[42px] px-4 inline-flex items-center gap-1 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {t('demo.acceptBtn')}
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewWorker(w.id, 'Rejected')}
                            className="min-h-[42px] px-4 inline-flex items-center gap-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                          >
                            <XCircle className="w-4 h-4" />
                            {t('demo.rejectBtn')}
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t(`statuses.${status}`, status)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep(5)}
            className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base"
          >
            {t('demo.confirmBookingBtn')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STEP 5: BOOKING CONFIRMATION */}
      {step === 5 && (
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-forest-900">
                {t('demo.step5Title')}
              </h2>
              <p className="text-xs text-slate-500">
                Demo Request ID: LR-DEMO-2026 · {t('demo.demoDataTag')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 space-y-1.5">
              <div className="text-xs font-bold uppercase text-slate-500">
                {t('labourRequest.categoryLabel')}
              </div>
              <div className="font-bold text-slate-900">{request.category}</div>
              <div className="text-xs text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {request.startDate} ({request.durationDays}{' '}
                {t('common.days')})
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {request.village}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 space-y-1.5">
              <div className="text-xs font-bold uppercase text-forest-700">
                {t('demo.totalCostLabel')}
              </div>
              <div className="text-3xl font-extrabold text-forest-900">
                {formatCurrency(
                  acceptedWorkers.length > 0 ? acceptedTotalCost : totalEstimatedCost
                )}
              </div>
              <div className="text-xs text-forest-800">
                {formatCurrency(request.dailyWage)} {t('common.perDay')} ·{' '}
                {acceptedWorkers.length} {t('demo.selectedWorkersLabel')}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {t('demo.selectedWorkersLabel')} ({acceptedWorkers.length})
            </div>
            {acceptedWorkers.length === 0 ? (
              <p className="text-xs text-slate-500">
                Go back to Step 4 to accept at least one simulated worker.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {acceptedWorkers.map((w) => (
                  <span
                    key={w.id}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold"
                  >
                    {w.name} ({w.village})
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={resetDemo}
            className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base"
          >
            <RotateCcw className="w-4 h-4" />
            {t('demo.replayBtn')}
          </button>
        </div>
      )}
    </div>
  );
}
