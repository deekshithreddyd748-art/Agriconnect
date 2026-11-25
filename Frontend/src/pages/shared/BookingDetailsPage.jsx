import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, MapPin, Phone, Check, X } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { formatCurrency } from '../../utils/distance';

export default function BookingDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [providerNote, setProviderNote] = useState('');

  function fetchBooking() {
    setLoading(true);
    api
      .get(`/bookings/${id}`)
      .then((res) => {
        setBooking(res.data.data);
        setProviderNote(res.data.data?.providerNote || '');
      })
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchBooking();
  }, [id]);

  async function updateStatus(status) {
    try {
      await api.patch(`/bookings/${id}/status`, { status, providerNote });
      toast.success(`Booking marked as ${status}.`);
      fetchBooking();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update booking status.'));
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading booking...</div>;
  }
  if (!booking) {
    return <div className="py-16 text-center text-sm text-slate-600">Booking not found.</div>;
  }

  const isFarmer = user?._id === booking.farmerId?._id;
  const isProvider = user?._id === booking.providerId?._id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to={isFarmer ? '/farmer/bookings' : '/provider/bookings'}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-earth-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
              {booking.serviceType} Booking
            </span>
            <h1 className="text-2xl font-bold text-forest-900 mt-1">
              {booking.serviceName}
            </h1>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 space-y-1.5">
            <div className="text-xs font-bold uppercase text-slate-500">Schedule & Scope</div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Calendar className="w-4 h-4 text-forest-700" />
              Date: {booking.bookingDate}
            </div>
            <div>
              Duration: <strong>{booking.duration} {booking.durationUnit}(s)</strong>
            </div>
            {booking.serviceType === 'labour' && (
              <div>Workers Requested: <strong>{booking.workersRequested}</strong></div>
            )}
            {booking.serviceType === 'facility' && (
              <div>
                Reserved Quantity: <strong>{booking.quantity}</strong>{' '}
                {booking.selectedService && `(${booking.selectedService})`}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 space-y-1.5">
            <div className="text-xs font-bold uppercase text-forest-700">Cost Estimate</div>
            <div className="text-2xl font-extrabold text-forest-900">
              {formatCurrency(booking.estimatedCost)}
            </div>
            <div className="text-xs text-forest-800">{booking.paymentMethod}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-2xl border border-earth-200 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-500">Farmer Details</div>
            <div className="font-semibold text-slate-900">{booking.farmerId?.name}</div>
            <div className="text-xs text-slate-600 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> {booking.farmerId?.phone}
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {booking.farmLocation?.address || booking.farmerId?.village}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-earth-200 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-500">Provider Details</div>
            <div className="font-semibold text-slate-900">{booking.providerId?.name}</div>
            <div className="text-xs text-slate-600 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> {booking.providerId?.phone}
            </div>
            <div className="text-xs text-slate-600">
              {[booking.providerId?.village, booking.providerId?.district]
                .filter(Boolean)
                .join(', ')}
            </div>
          </div>
        </div>

        {booking.notes && (
          <div className="text-sm bg-earth-50 rounded-2xl p-4 border border-earth-200">
            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">
              Farmer Notes
            </span>
            {booking.notes}
          </div>
        )}

        {booking.providerNote && (
          <div className="text-sm bg-forest-50 rounded-2xl p-4 border border-forest-200">
            <span className="text-xs font-bold uppercase text-forest-700 block mb-1">
              Provider Response Note
            </span>
            {booking.providerNote}
          </div>
        )}

        {/* Action Controls */}
        {isFarmer && booking.status === 'Pending' && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => updateStatus('Cancelled')}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
            >
              Cancel Pending Booking
            </button>
          </div>
        )}

        {(isProvider || user?.role === 'admin') &&
          (booking.status === 'Pending' || booking.status === 'Accepted') && (
            <div className="pt-4 border-t border-earth-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Response Note to Farmer (Optional)
              </label>
              <input
                type="text"
                value={providerNote}
                onChange={(e) => setProviderNote(e.target.value)}
                placeholder="e.g., Confirmed arrival at 7:30 AM"
                className="w-full px-3.5 py-2 rounded-xl border border-earth-200 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {booking.status === 'Pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateStatus('Accepted')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold"
                    >
                      <Check className="w-4 h-4" /> Accept Request
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus('Rejected')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
                    >
                      <X className="w-4 h-4" /> Reject Request
                    </button>
                  </>
                )}
                {booking.status === 'Accepted' && (
                  <button
                    type="button"
                    onClick={() => updateStatus('Completed')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold"
                  >
                    <Check className="w-4 h-4" /> Mark as Completed
                  </button>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
