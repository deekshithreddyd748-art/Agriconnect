import { Link } from 'react-router-dom';
import { Tractor, Users, Warehouse, MapPin, ArrowRight } from 'lucide-react';
import {
  EQUIPMENT_CATEGORIES,
  FACILITY_CATEGORIES,
  LABOUR_CATEGORIES,
} from '../../utils/constants';

export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-forest-900">
            AgriConnect Service Directory
          </h1>
          <p className="text-slate-600 mt-1">
            Explore hyperlocal agricultural machinery, skilled labour squads, and
            post-harvest infrastructure.
          </p>
        </div>
        <Link
          to="/nearby-map"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800 w-fit"
        >
          <MapPin className="w-4 h-4" /> View All on Nearby Map
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
              <Tractor className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Agricultural Machinery
            </h2>
            <p className="text-sm text-slate-600 mt-1 mb-4">
              10 equipment categories ready for hourly, daily, or per-acre booking.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg bg-earth-100 text-slate-700 text-xs font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/machinery"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
          >
            Open Machinery Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-harvest-100 text-harvest-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Agricultural Labour Network
            </h2>
            <p className="text-sm text-slate-600 mt-1 mb-4">
              Verified farm crews across 7 specialized agricultural operations.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LABOUR_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg bg-earth-100 text-slate-700 text-xs font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/labour"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
          >
            Browse Labour Teams <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4">
              <Warehouse className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Post-Harvest Facilities
            </h2>
            <p className="text-sm text-slate-600 mt-1 mb-4">
              Storage, drying, milling, grading, and packaging infrastructure.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FACILITY_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg bg-earth-100 text-slate-700 text-xs font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/facilities"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
          >
            Explore Facilities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
