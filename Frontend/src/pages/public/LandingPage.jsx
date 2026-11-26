import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Tractor,
  Users,
  Warehouse,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  Compass,
  CheckCircle2,
  TrendingUp,
  CalendarCheck,
  Quote,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { formatNumber } from '../../utils/distance';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { enterGuestMode } = useAuth();
  const [stats, setStats] = useState(null);

  const handleExploreDemo = () => {
    enterGuestMode('farmer');
    navigate('/farmer/dashboard');
  };

  useEffect(() => {
    api
      .get('/discovery/public-stats')
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null));
  }, []);

  const statItems = [
    {
      label: t('landing.stats.farmers'),
      value: stats ? formatNumber(stats.farmers, i18n.language) : '—',
    },
    {
      label: t('landing.stats.providers'),
      value: stats ? formatNumber(stats.providers, i18n.language) : '—',
    },
    {
      label: t('landing.stats.listings'),
      value: stats ? formatNumber(stats.totalServices, i18n.language) : '—',
    },
    {
      label: t('landing.stats.bookings'),
      value: stats ? formatNumber(stats.bookings, i18n.language) : '—',
    },
  ];

  const testimonials = t('landing.testimonials.items', { returnObjects: true });
  const testimonialList = Array.isArray(testimonials) ? testimonials : [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-forest-700 min-h-[560px] lg:min-h-[620px] flex items-center">
        <img
          src="/images/hero-farmer.jpg"
          alt={t('landing.heroImgAlt')}
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#14532D]/95 via-[#14532D]/80 to-[#14532D]/25"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-xs font-semibold text-forest-100">
              <Compass className="w-3.5 h-3.5 text-fresh-500" />
              {t('landing.badge')}
            </div>
            <LanguageSwitcher />
          </div>

          <div className="max-w-2xl space-y-6 text-white">
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight leading-[1.14] text-white">
              {t('landing.heroTitle')}
            </h1>

            <p className="text-base sm:text-lg text-forest-100 leading-relaxed max-w-xl">
              {t('landing.heroSubtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/machinery"
                className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-xl bg-fresh-500 hover:bg-fresh-600 text-forest-900 font-bold text-sm shadow-sm transition-colors"
              >
                <Tractor className="w-4 h-4" />
                {t('landing.findEquipment')}
              </Link>
              <Link
                to="/labour"
                className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-xl bg-white hover:bg-earth-100 text-forest-800 font-bold text-sm shadow-sm transition-colors"
              >
                <Users className="w-4 h-4" />
                {t('landing.findLabour')}
              </Link>
              <Link
                to="/facilities"
                className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold text-sm backdrop-blur-sm transition-colors"
              >
                <Warehouse className="w-4 h-4" />
                {t('landing.exploreFacilities')}
              </Link>
              <button
                type="button"
                onClick={handleExploreDemo}
                className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-xl bg-amber-400 hover:bg-amber-300 text-forest-900 font-bold text-sm shadow-sm transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Explore Demo (Guest)
              </button>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-xl border border-fresh-500 text-forest-100 hover:bg-fresh-500/20 font-semibold text-sm transition-colors"
              >
                {t('landing.joinAgriconnect')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="pt-1">
              <Link
                to="/labour-demo"
                className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-harvest-600 hover:bg-harvest-700 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                {t('landing.tryLabourDemo')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-2xl border border-earth-200 p-5 shadow-md"
            >
              <div className="text-3xl font-extrabold text-forest-700">
                {item.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Available Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
            {t('landing.servicesSection.eyebrow')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-forest-700 mt-1">
            {t('landing.servicesSection.title')}
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            {t('landing.servicesSection.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
                <Tractor className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t('landing.servicesSection.machineryTitle')}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {t('landing.servicesSection.machineryDesc')}
              </p>
            </div>
            <Link
              to="/machinery"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900"
            >
              {t('landing.findEquipment')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-harvest-100 text-harvest-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t('landing.servicesSection.labourTitle')}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {t('landing.servicesSection.labourDesc')}
              </p>
            </div>
            <Link
              to="/labour"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900"
            >
              {t('landing.findLabour')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4">
                <Warehouse className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t('landing.servicesSection.facilitiesTitle')}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {t('landing.servicesSection.facilitiesDesc')}
              </p>
            </div>
            <Link
              to="/facilities"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900"
            >
              {t('landing.exploreFacilities')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-earth-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
              {t('landing.howSection.eyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-forest-700 mt-1">
              {t('landing.howSection.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-6 rounded-2xl bg-earth-50 border border-earth-200 space-y-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold">
                  {n}
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {t(`landing.howSection.step${n}Title`)}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t(`landing.howSection.step${n}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-earth-200 p-8 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" /> {t('landing.benefits.farmerTag')}
            </div>
            <h3 className="text-2xl font-bold text-forest-900">
              {t('landing.benefits.farmerTitle')}
            </h3>
            <ul className="space-y-3 text-sm text-slate-700">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                  {t(`landing.benefits.farmerPoint${n}`)}
                </li>
              ))}
            </ul>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/nearby-map"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:underline"
              >
                <MapPin className="w-4 h-4" /> {t('landing.benefits.viewNearbyMap')}
              </Link>
              <Link
                to="/labour-demo"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-harvest-700 hover:underline"
              >
                <PlayCircle className="w-4 h-4" /> {t('landing.tryLabourDemo')}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-earth-200 p-8 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-harvest-100 text-harvest-700 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> {t('landing.benefits.providerTag')}
            </div>
            <h3 className="text-2xl font-bold text-forest-900">
              {t('landing.benefits.providerTitle')}
            </h3>
            <ul className="space-y-3 text-sm text-slate-700">
              {[1, 2, 3].map((n) => {
                const Icon = n === 1 ? ShieldCheck : n === 2 ? CalendarCheck : TrendingUp;
                return (
                  <li key={n} className="flex items-start gap-2.5">
                    <Icon className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                    {t(`landing.benefits.providerPoint${n}`)}
                  </li>
                );
              })}
            </ul>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:underline"
              >
                {t('landing.benefits.registerProvider')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Testimonials */}
      <section className="bg-white border-t border-earth-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
                {t('landing.testimonials.eyebrow')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-forest-700 mt-1">
                {t('landing.testimonials.title')}
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              {t('landing.testimonials.disclaimer')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonialList.map((tItem) => (
              <div
                key={tItem.name}
                className="p-6 rounded-2xl bg-earth-50 border border-earth-200 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <Quote className="w-6 h-6 text-fresh-600" />
                  <p className="text-sm text-slate-700 leading-relaxed">
                    &ldquo;{tItem.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-3 border-t border-earth-200">
                  <div className="font-bold text-sm text-slate-900">{tItem.name}</div>
                  <div className="text-xs text-slate-500">{tItem.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
