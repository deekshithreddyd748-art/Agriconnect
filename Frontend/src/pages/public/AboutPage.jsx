import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, Target, Globe2, Handshake } from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="bg-white rounded-3xl border border-earth-200 p-8 sm:p-10 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-semibold">
          <Sprout className="w-4 h-4" /> {t('about.eyebrow')}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-900">
          {t('about.title')}
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          {t('about.subtitle')}
        </p>
        <p className="text-slate-600 text-base leading-relaxed">
          {t('about.missionDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-earth-200 p-6 space-y-2">
          <Target className="w-7 h-7 text-forest-700" />
          <h3 className="font-bold text-slate-900">{t('about.pillar1Title')}</h3>
          <p className="text-sm text-slate-600">{t('about.pillar1Desc')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-earth-200 p-6 space-y-2">
          <Handshake className="w-7 h-7 text-forest-700" />
          <h3 className="font-bold text-slate-900">{t('about.pillar2Title')}</h3>
          <p className="text-sm text-slate-600">{t('about.pillar2Desc')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-earth-200 p-6 space-y-2">
          <Globe2 className="w-7 h-7 text-forest-700" />
          <h3 className="font-bold text-slate-900">{t('about.pillar3Title')}</h3>
          <p className="text-sm text-slate-600">{t('about.pillar3Desc')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/services"
          className="px-5 py-3 rounded-xl bg-forest-700 text-white font-semibold text-sm hover:bg-forest-800"
        >
          {t('footer.allServicesLink')}
        </Link>
        <Link
          to="/register"
          className="px-5 py-3 rounded-xl border border-forest-700 text-forest-800 font-semibold text-sm hover:bg-forest-50"
        >
          {t('nav.register')}
        </Link>
      </div>
    </div>
  );
}
