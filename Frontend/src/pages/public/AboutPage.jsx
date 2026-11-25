import { Link } from 'react-router-dom';
import { Sprout, Target, Globe2, Handshake } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="bg-white rounded-3xl border border-earth-200 p-8 sm:p-10 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-semibold">
          <Sprout className="w-4 h-4" /> About AgriConnect
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-900">
          Building Rural Collaboration Around Every Village
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Smallholder farmers often lose critical days during sowing and harvest
          windows searching by word of mouth for tractors, skilled agricultural
          workers, and safe storage. Meanwhile, local equipment owners and post-harvest
          facilities run under capacity because nearby farmers cannot easily find
          their availability.
        </p>
        <p className="text-slate-600 text-base leading-relaxed">
          AgriConnect bridges this gap with a mobile-friendly, hyperlocal marketplace
          combining real distance discovery, transparent rate estimates, and
          role-specific management dashboards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-earth-200 p-6 space-y-2">
          <Target className="w-7 h-7 text-forest-700" />
          <h3 className="font-bold text-slate-900">Our Mission</h3>
          <p className="text-sm text-slate-600">
            Reduce search time, cut post-harvest losses, and make modern farm
            mechanization accessible within a 10–15 km radius.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-earth-200 p-6 space-y-2">
          <Handshake className="w-7 h-7 text-forest-700" />
          <h3 className="font-bold text-slate-900">Direct Collaboration</h3>
          <p className="text-sm text-slate-600">
            Farmers connect directly with local machinery owners, labour coordinators,
            and cold storage operators with zero hidden fees.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-earth-200 p-6 space-y-2">
          <Globe2 className="w-7 h-7 text-forest-700" />
          <h3 className="font-bold text-slate-900">Open & Accessible</h3>
          <p className="text-sm text-slate-600">
            Powered by OpenStreetMap, Leaflet, and mobile-first design tailored for
            rural connectivity.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/services"
          className="px-5 py-3 rounded-xl bg-forest-700 text-white font-semibold text-sm hover:bg-forest-800"
        >
          Explore Services
        </Link>
        <Link
          to="/register"
          className="px-5 py-3 rounded-xl border border-forest-700 text-forest-800 font-semibold text-sm hover:bg-forest-50"
        >
          Create Free Account
        </Link>
      </div>
    </div>
  );
}
