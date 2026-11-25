import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  PackageCheck,
  Inbox,
  CheckCircle2,
  IndianRupee,
  ToggleLeft,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { formatCurrency } from '../../utils/distance';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/discovery/dashboard')
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
            {ROLE_LABELS[user?.role]} Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900 mt-0.5">
            Welcome, {user?.name}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/provider/listings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" /> Add New Listing
          </Link>
          <Link
            to="/provider/listings"
            className="px-4 py-2.5 rounded-xl bg-white border border-earth-200 text-slate-800 text-sm font-semibold hover:bg-earth-50"
          >
            My Listings
          </Link>
          <Link
            to="/provider/requests"
            className="px-4 py-2.5 rounded-xl bg-white border border-earth-200 text-slate-800 text-sm font-semibold hover:bg-earth-50"
          >
            Booking Requests
          </Link>
          <Link
            to="/provider/availability"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-50 text-forest-800 text-sm font-semibold hover:bg-forest-100"
          >
            <ToggleLeft className="w-4 h-4" /> Availability
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading provider overview...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                Active Listings
                <PackageCheck className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.activeListings ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                of {stats?.totalListings ?? 0} total
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                Pending Requests
                <Inbox className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-amber-700 mt-2">
                {stats?.pendingRequestsCount ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">Awaiting response</div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                Accepted
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.acceptedBookingsCount ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">Scheduled jobs</div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                Completed
                <CheckCircle2 className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {stats?.completedServicesCount ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">Delivered</div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                Est. Revenue
                <IndianRupee className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-2xl font-extrabold text-forest-900 mt-2">
                {formatCurrency(stats?.estimatedEarnings ?? 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Accepted + Completed</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Recent Booking Requests
              </h2>
              <Link
                to="/provider/bookings"
                className="text-xs font-semibold text-forest-700 hover:underline inline-flex items-center gap-1"
              >
                Manage All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(stats?.recentRequests || []).length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                No booking requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentRequests.map((req) => (
                  <Link
                    key={req._id}
                    to={`/bookings/${req._id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-earth-200 hover:bg-earth-50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {req.serviceName}
                      </div>
                      <div className="text-xs text-slate-500">
                        Farmer: {req.farmerId?.name} ({req.farmerId?.village}) · Date:{' '}
                        {req.bookingDate} · {formatCurrency(req.estimatedCost)}
                      </div>
                    </div>
                    <BookingStatusBadge status={req.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
