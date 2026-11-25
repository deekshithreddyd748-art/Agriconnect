import { Link } from 'react-router-dom';
import { MapPin, Search, CalendarCheck, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    icon: MapPin,
    title: '1. Set Your Farm Location',
    desc: 'Grant browser GPS permission or simply select your village/town from the preset list or map picker. AgriConnect calculates real Haversine distances to providers.',
  },
  {
    icon: Search,
    title: '2. Discover Nearby Services',
    desc: 'Filter machinery, labour teams, and post-harvest facilities by category, price ceiling, availability, and radius (5 km, 10 km, 15 km, or 25 km).',
  },
  {
    icon: CalendarCheck,
    title: '3. Submit a Booking Request',
    desc: 'Choose your date, hours/days or quantity, and review the transparent cost estimate before sending the request directly to the provider.',
  },
  {
    icon: CheckCircle,
    title: '4. Track & Complete',
    desc: 'Providers review and accept or reject requests from their dashboard. Track live status updates (Pending, Accepted, Completed) in My Bookings.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-900">
          How AgriConnect Works
        </h1>
        <p className="text-slate-600">
          Designed for simplicity so farmers and local providers can coordinate
          agricultural resources in minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-3"
            >
              <div className="w-11 h-11 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-forest-50 border border-forest-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-forest-900 text-lg">
            Ready to try the live workflow?
          </h3>
          <p className="text-sm text-forest-700">
            Use our one-click hackathon demo accounts on the Login page.
          </p>
        </div>
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
