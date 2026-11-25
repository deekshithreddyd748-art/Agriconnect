import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Users,
  Tractor,
  Warehouse,
  CalendarCheck,
  Trash2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import api, { getErrorMessage } from '../../services/api';
import { BookingStatusBadge, AvailabilityBadge } from '../../components/StatusBadge';
import { ROLE_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/distance';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  function loadAll() {
    setLoading(true);
    Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/users'),
      api.get('/admin/listings'),
    ])
      .then(([ovRes, uRes, lRes]) => {
        setOverview(ovRes.data.data);
        setUsers(uRes.data.data || []);
        setListings(lRes.data.data || []);
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load admin data.')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function toggleUser(id) {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      toast.success('User status updated.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function removeUser(id) {
    if (!window.confirm('Remove this user account?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User removed.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function toggleListing(type, id) {
    try {
      await api.patch(`/admin/listings/${type}/${id}/toggle`);
      toast.success('Listing availability updated.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function removeListing(type, id) {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/admin/listings/${type}/${id}`);
      toast.success('Listing removed.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Loading administrator analytics...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-forest-700" />
            Administrator Control Center
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Platform-wide metrics, user governance, and listing oversight.
          </p>
        </div>

        <div className="inline-flex bg-white border border-earth-200 p-1 rounded-xl">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: `Users (${users.length})` },
            { id: 'listings', label: `Listings (${listings.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                activeTab === tab.id
                  ? 'bg-forest-700 text-white'
                  : 'text-slate-600 hover:bg-earth-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && overview && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-500 flex justify-between">
                Total Users <Users className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {overview.totalUsers}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {overview.totalFarmers} Farmers · {overview.totalProviders} Providers
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-500 flex justify-between">
                Machinery <Tractor className="w-4 h-4 text-forest-700" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {overview.totalEquipment}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {overview.totalLabour} Labour Teams
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-500 flex justify-between">
                Facilities <Warehouse className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {overview.totalFacilities}
              </div>
              <div className="text-xs text-slate-500 mt-1">Post-harvest units</div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-500 flex justify-between">
                Total Bookings <CalendarCheck className="w-4 h-4 text-harvest-600" />
              </div>
              <div className="text-3xl font-extrabold text-forest-900 mt-2">
                {overview.totalBookings}
              </div>
              <div className="text-xs text-slate-500 mt-1">Across all modules</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-2xl border border-earth-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Booking Status Breakdown
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.bookingStatusBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6E0CE" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1B4332" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900">
                Recent Platform Activity
              </h2>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {(overview.recentBookings || []).map((b) => (
                  <div
                    key={b._id}
                    className="p-3 rounded-xl bg-earth-50 border border-earth-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{b.serviceName}</div>
                      <div className="text-slate-500">
                        {b.farmerId?.name} → {b.providerId?.name} ·{' '}
                        {formatCurrency(b.estimatedCost)}
                      </div>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-earth-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-earth-50 border-b border-earth-200 text-xs uppercase text-slate-600">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-200">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="p-4 text-xs font-medium">{ROLE_LABELS[u.role]}</td>
                  <td className="p-4 text-xs text-slate-600">
                    {[u.village, u.district].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {u.role !== 'admin' && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleUser(u._id)}
                          className="px-3 py-1 rounded-lg bg-earth-100 hover:bg-earth-200 text-xs font-semibold"
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeUser(u._id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="bg-white rounded-2xl border border-earth-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-earth-50 border-b border-earth-200 text-xs uppercase text-slate-600">
              <tr>
                <th className="p-4">Listing</th>
                <th className="p-4">Module</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Availability</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-200">
              {listings.map((item) => (
                <tr key={`${item.type}-${item._id}`}>
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.category}</div>
                  </td>
                  <td className="p-4 text-xs uppercase font-bold text-slate-600">
                    {item.type}
                  </td>
                  <td className="p-4 text-xs text-slate-700">{item.ownerName}</td>
                  <td className="p-4">
                    <AvailabilityBadge available={item.availability} />
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleListing(item.type, item._id)}
                      className="px-3 py-1 rounded-lg bg-earth-100 hover:bg-earth-200 text-xs font-semibold"
                    >
                      Toggle
                    </button>
                    <button
                      type="button"
                      onClick={() => removeListing(item.type, item._id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                      title="Delete listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
