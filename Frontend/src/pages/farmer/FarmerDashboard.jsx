import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tractor,
  Users,
  Warehouse,
  MapPin,
  CalendarClock,
  ArrowRight,
  Compass,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import LocationSelector from '../../components/LocationSelector';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { formatCurrency } from '../../utils/distance';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { coords, hasCoords, radius } = useLocationContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/discovery/dashboard', {
        params: hasCoords ? { lat: coords.lat, lng: coords.lng, radius } : {},
      })
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [coords?.lat, coords?.lng, hasCoords, radius]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage your hyperlocal agricultural bookings and discover nearby support.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/machinery"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
          >
            <Tractor className="w-4 h-4" /> Find Machinery
          </Link>
          <Link
            to="/labour"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-earth-200 text-slate-800 text-sm font-semibold hover:bg-earth-50"
          >
            <Users className="w-4 h-4" /> Find Labour
          </Link>
          <Link
            to="/facilities"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-earth-200 text-slate-800 text-sm font-semibold hover:bg-earth-50"
          >
            <Warehouse className="w-4 h-4" /> Find Facilities
          </Link>
          <Link
            to="/nearby-map"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-50 text-forest-800 text-sm font-semibold hover:bg-forest-100"
          >
            <MapPin className="w-4 h-4" /> View Nearby Map
          </Link>
        </div>
      </div>

      <LocationSelector />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading dashboard data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                Nearby Services
                <Compass className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.nearbyServiceCount ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {radius > 0 && hasCoords ? `Within ${radius} km` : 'Across all regions'}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                Available Machinery
                <Tractor className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.availableMachineryCount ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {stats?.totalAvailableMachinery ?? 0} total listed
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                Labour Teams
                <Users className="w-4 h-4 text-harvest-600" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.availableLabourCount ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {stats?.totalAvailableLabour ?? 0} total crews
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                Nearby Facilities
                <Warehouse className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.nearbyFacilitiesCount ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {stats?.totalAvailableFacilities ?? 0} total hubs
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming & Pending */}
            <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-forest-700" />
                  Upcoming & Pending Bookings
                </h2>
                <Link
                  to="/farmer/bookings"
                  className="text-xs font-semibold text-forest-700 hover:underline inline-flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {[...(stats?.upcomingBookings || []), ...(stats?.pendingBookings || [])]
                .length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  No active or pending bookings yet. Browse nearby machinery or labour
                  to submit your first request.
                </p>
              ) : (
                <div className="space-y-3">
                  {[
                    ...(stats?.upcomingBookings || []),
                    ...(stats?.pendingBookings || []),
                  ]
                    .slice(0, 5)
                    .map((b) => (
                      <Link
                        key={b._id}
                        to={`/bookings/${b._id}`}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-earth-200 hover:bg-earth-50 transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900">
                            {b.serviceName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Date: {b.bookingDate} · Est. {formatCurrency(b.estimatedCost)}
                          </div>
                        </div>
                        <BookingStatusBadge status={b.status} />
                      </Link>
                    ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              {(stats?.recentActivity || []).length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  No booking activity recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((item) => (
                    <Link
                      key={item._id}
                      to={`/bookings/${item._id}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-earth-50 border border-earth-200 hover:border-forest-500 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {item.serviceName}
                        </div>
                        <div className="text-xs text-slate-500">
                          Provider: {item.providerId?.name || 'Local Provider'} ·{' '}
                          {item.serviceType}
                        </div>
                      </div>
                      <BookingStatusBadge status={item.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
