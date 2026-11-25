import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, Tractor, PlayCircle, CheckCircle2 } from 'lucide-react';

export default function HowItWorksPage() {
  const { t } = useTranslation();

  const farmerSteps = t('howItWorks.farmerSteps', { returnObjects: true });
  const providerSteps = t('howItWorks.providerSteps', { returnObjects: true });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
          {t('howItWorks.eyebrow')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-900">
          {t('howItWorks.title')}
        </h1>
        <p className="text-slate-600">{t('howItWorks.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold">
            <Sprout className="w-4 h-4" />
            {t('howItWorks.forFarmersTitle')}
          </div>
          <ol className="space-y-3">
            {(Array.isArray(farmerSteps) ? farmerSteps : []).map((stepText, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="w-6 h-6 rounded-full bg-forest-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{stepText}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-harvest-100 text-harvest-700 text-xs font-bold">
            <Tractor className="w-4 h-4" />
            {t('howItWorks.forWorkersTitle')}
          </div>
          <ol className="space-y-3">
            {(Array.isArray(providerSteps) ? providerSteps : []).map((stepText, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-fresh-600 shrink-0 mt-0.5" />
                <span>{stepText}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="bg-forest-50 border border-forest-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-forest-900 text-lg">
            {t('howItWorks.tryDemoCta')}
          </h3>
          <p className="text-sm text-forest-700">{t('demo.bannerSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            to="/labour-demo"
            className="px-5 py-2.5 inline-flex items-center gap-2 rounded-xl bg-harvest-600 text-white text-sm font-bold hover:bg-harvest-700"
          >
            <PlayCircle className="w-4 h-4" />
            {t('nav.labourDemo')}
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
          >
            {t('nav.login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
