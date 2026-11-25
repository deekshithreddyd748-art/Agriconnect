import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import api from '../../services/api';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const SAMPLE_TESTIMONIALS = [
  {
    name: 'Rajesh Patil',
    role: 'Sugarcane & Wheat Farmer, Baramati (Sample Review)',
    quote:
      'Finding a combine harvester within 8 km used to take two days of phone calls. On AgriConnect I compared rates and got confirmation in under an hour.',
  },
  {
    name: 'Suresh Deshmukh',
    role: 'Tractor & Rotavator Owner, Malegaon Bk (Sample Review)',
    quote:
      'My tractor used to sit idle between sowing cycles. Now nearby farmers book slots directly, keeping utilization high throughout the season.',
  },
  {
    name: 'Vikram Kulkarni',
    role: 'Cold Storage Operator, MIDC Baramati (Sample Review)',
    quote:
      'Farmers see our live remaining cold storage capacity before arriving, which prevents spoilage and makes intake scheduling predictable.',
  },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/discovery/public-stats')
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null));
  }, []);

  const statItems = [
    { label: 'Registered Farmers', value: stats ? stats.farmers : '—' },
    { label: 'Verified Providers', value: stats ? stats.providers : '—' },
    { label: 'Active Listings', value: stats ? stats.totalServices : '—' },
    { label: 'Bookings Managed', value: stats ? stats.bookings : '—' },
  ];

  return (
    <div>
      {/* Hero Section with Real Indian Farmer Photography */}
      <section className="relative overflow-hidden bg-forest-700 min-h-[560px] lg:min-h-[620px] flex items-center">
        <img
          src="/images/hero-farmer.jpg"
          alt="Indian farmer working in a lush green agricultural field"
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
            Available Services
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-forest-700 mt-1">
            Everything Your Farm Needs Within 10–15 km
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Search verified machinery, skilled farm crews, and post-harvest
            infrastructure sorted by real distance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
                <Tractor className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Machinery Rental</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Tractors, harvesters, rotavators, tillers, seeders, sprayers, and
                ploughs with clear hourly, daily, or per-acre rates.
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
              <h3 className="text-xl font-bold text-slate-900">Agricultural Labour</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Post labour requests or hire skilled crews for harvesting, sowing,
                transplantation, weeding, spraying, and irrigation.
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
                Post-Harvest Facilities
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Locate nearby warehouses, cold storages, drying units, sorting,
                grading, and packaging facilities with live available capacity.
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
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-forest-700 mt-1">
              From Search to Service in Three Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-earth-50 border border-earth-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                Set Village or GPS Location
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Use browser GPS or choose your village/district manually. AgriConnect
                calculates exact Haversine distances within a 5–25 km radius.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-earth-50 border border-earth-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                Post Labour or Book Equipment
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Request farm workers by daily wage, or book nearby machinery and cold
                storage with an instant transparent cost estimate.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-earth-50 border border-earth-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                Track Confirmation Live
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Accept local worker applications or track provider approvals right from
                your mobile-friendly dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Farmers & Equipment Owners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-earth-200 p-8 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" /> Benefits for Farmers
            </div>
            <h3 className="text-2xl font-bold text-forest-900">
              Save Critical Sowing & Harvest Time
            </h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                Register quickly with your mobile number in 6 regional Indian languages.
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                Post farm labour needs with clear daily wages and review local worker
                applications.
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                Locate nearby tractors and cold storage on an interactive OpenStreetMap view.
              </li>
            </ul>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/nearby-map"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:underline"
              >
                <MapPin className="w-4 h-4" /> View Nearby Services Map
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
              <TrendingUp className="w-3.5 h-3.5" /> Benefits for Equipment Owners & Providers
            </div>
            <h3 className="text-2xl font-bold text-forest-900">
              Turn Idle Machinery & Capacity Into Income
            </h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                List machinery, labour teams, or storage units with photos, rates, and
                operating radius.
              </li>
              <li className="flex items-start gap-2.5">
                <CalendarCheck className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                Accept or reject incoming requests and apply directly to open farmer jobs.
              </li>
              <li className="flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                Reach farmers within 5–25 km without middlemen or commission delays.
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:underline"
              >
                Register as Equipment or Facility Provider <ArrowRight className="w-4 h-4" />
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
                Sample Demo Reviews
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-forest-700 mt-1">
                Stories from Rural Collaborators
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              * Illustrative sample stories representing target AgriConnect personas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SAMPLE_TESTIMONIALS.map((tItem) => (
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
