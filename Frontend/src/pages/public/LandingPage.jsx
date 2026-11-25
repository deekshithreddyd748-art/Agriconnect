import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import api from '../../services/api';

export default function LandingPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/discovery/public-stats')
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null));
  }, []);

  const statItems = [
    { label: 'Registered Farmers', value: stats ? stats.farmers : '—' },
    { label: 'Local Providers', value: stats ? stats.providers : '—' },
    { label: 'Active Services', value: stats ? stats.totalServices : '—' },
    { label: 'Total Bookings', value: stats ? stats.bookings : '—' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-forest-50 via-earth-50 to-earth-50 border-b border-earth-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                Hyperlocal Agricultural Collaboration Platform
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-forest-900 tracking-tight leading-[1.12]">
                Everything Your Farm Needs, Just Around the Corner.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Discover nearby agricultural machinery, connect with skilled farm
                labour and access post-harvest facilities through one simple
                platform.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm sm:text-base shadow-sm transition-colors"
                >
                  Explore Services
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-forest-700 text-forest-800 hover:bg-forest-50 font-semibold text-sm sm:text-base transition-colors"
                >
                  Join AgriConnect
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                {statItems.map((item) => (
                  <div
                    key={item.label}
                    className="bg-white border border-earth-200 rounded-xl p-3.5 shadow-sm"
                  >
                    <div className="text-2xl font-extrabold text-forest-800">
                      {item.value}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white p-3 rounded-3xl border border-earth-200 shadow-md">
                <img
                  src="/images/hero-farm.svg"
                  alt="AgriConnect farm machinery and rural collaboration"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Core Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-forest-900">
            Three Pillars of Local Farm Support
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Access verified local resources within 5 to 25 km without middlemen or
            days of phone calls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
                <Tractor className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Machinery Rental</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Rent tractors, harvesters, rotavators, seed drills, sprayers, and
                water pumps priced transparently per hour, day, or acre.
              </p>
            </div>
            <Link
              to="/machinery"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900"
            >
              Browse Machinery <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-harvest-100 text-harvest-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Agricultural Labour</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Book trained local teams for harvesting, sowing, transplantation,
                weeding, and irrigation with clear per-worker rates.
              </p>
            </div>
            <Link
              to="/labour"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900"
            >
              Find Farm Labour <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4">
                <Warehouse className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Post-Harvest Facilities
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Prevent crop spoilage with nearby cold storages, warehouses, grain
                dryers, mills, and sorting units showing live capacity.
              </p>
            </div>
            <Link
              to="/facilities"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900"
            >
              Discover Facilities <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hyperlocal Discovery Explanation */}
      <section className="bg-white border-y border-earth-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
              Hyperlocal Discovery Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-forest-900">
              Real Distances. Zero Guesswork.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              AgriConnect uses your device GPS or simple town selection with
              Haversine great-circle calculations to sort machinery, labour teams,
              and storage hubs by exact distance—starting from 5 km up to 25 km.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-700 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0" />
                Switch seamlessly between List View and Interactive OpenStreetMap View
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0" />
                Honest location indicators—never displays fake or random distances
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0" />
                Manual town picker for farmers unfamiliar with digital map coordinates
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/nearby-map"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
              >
                <MapPin className="w-4 h-4" />
                Open Nearby Services Map
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-earth-50 border border-earth-200 space-y-2">
              <Clock className="w-6 h-6 text-forest-700" />
              <h4 className="font-bold text-slate-900">Faster Turnaround</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check real-time availability before submitting a booking so harvest
                windows are never missed.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-earth-50 border border-earth-200 space-y-2">
              <ShieldCheck className="w-6 h-6 text-forest-700" />
              <h4 className="font-bold text-slate-900">Transparent Estimates</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                See exact estimated charges upfront and settle directly with local
                providers upon service delivery.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-earth-50 border border-earth-200 space-y-2 sm:col-span-2">
              <h4 className="font-bold text-slate-900">How AgriConnect Works</h4>
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-forest-800 block">1. Locate</span>
                  Set your village or GPS and pick a 5–25 km radius.
                </div>
                <div>
                  <span className="font-bold text-forest-800 block">2. Request</span>
                  Compare rates, check capacity, and send a booking request.
                </div>
                <div>
                  <span className="font-bold text-forest-800 block">3. Track</span>
                  Providers accept/reject and you track status live.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provider CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-forest-800 text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Own Machinery, Lead a Farm Crew, or Operate Storage?
            </h2>
            <p className="text-forest-100 text-sm sm:text-base">
              List your tractors, harvesting teams, or cold storage on AgriConnect
              to boost utilization and receive direct booking requests from nearby
              farmers.
            </p>
          </div>
          <Link
            to="/register"
            className="shrink-0 px-6 py-3.5 rounded-xl bg-white text-forest-800 hover:bg-earth-100 font-bold text-sm shadow-sm transition-colors"
          >
            Register as a Provider
          </Link>
        </div>
      </section>
    </div>
  );
}
