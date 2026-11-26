import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, MapPin, Phone, Check, X } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookingStatusBadge } from '../../components/StatusBadge';
import ReviewsSection from '../../components/ReviewsSection';
import { formatCurrency, formatDate } from '../../utils/distance';

export default function BookingDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
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
      toast.success(
        t('labourRequest.bookingUpdatedMsg', { status: t(`statuses.${status}`, status) })
      );
      fetchBooking();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">{t('common.loading')}</div>
    );
  }
  if (!booking) {
    return (
      <div className="py-16 text-center text-sm text-slate-600">
        {t('common.noResults')}
      </div>
    );
  }

  const isFarmer = user?._id === booking.farmerId?._id;
  const isProvider = user?._id === booking.providerId?._id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to={isFarmer ? '/farmer/bookings' : '/provider/bookings'}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> {t('bookings.backToBookings')}
      </Link>

      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-earth-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
              {t(`bookings.${booking.serviceType}Type`, booking.serviceType)}
            </span>
            <h1 className="text-2xl font-bold text-forest-900 mt-1">
              {booking.serviceName}
            </h1>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 space-y-1.5">
            <div className="text-xs font-bold uppercase text-slate-500">
              {t('bookings.scheduleLabel')}
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Calendar className="w-4 h-4 text-forest-700" />
              {formatDate(booking.bookingDate, i18n.language)}
            </div>
            <div>
              <strong>
                {booking.duration} {booking.durationUnit}
              </strong>
            </div>
            {booking.serviceType === 'labour' && (
              <div>
                {t('common.workers')}: <strong>{booking.workersRequested}</strong>
              </div>
            )}
            {booking.serviceType === 'facility' && (
              <div>
                {t('marketplace.tonnageLabel')}: <strong>{booking.quantity}</strong>{' '}
                {booking.selectedService && `(${booking.selectedService})`}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 space-y-1.5">
            <div className="text-xs font-bold uppercase text-forest-700">
              {t('bookings.amountLabel')}
            </div>
            <div className="text-2xl font-extrabold text-forest-900">
              {formatCurrency(booking.estimatedCost, i18n.language)}
            </div>
            <div className="text-xs text-forest-800">{booking.paymentMethod}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-2xl border border-earth-200 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-500">
              {t('bookings.farmerLabel')}
            </div>
            <div className="font-semibold text-slate-900">{booking.farmerId?.name}</div>
            {booking.farmerId?.phone && (
              <div className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {booking.farmerId.phone}
              </div>
            )}
            <div className="text-xs text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {booking.farmLocation?.address || booking.farmerId?.village}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-earth-200 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-500">
              {t('bookings.providerLabel')}
            </div>
            <div className="font-semibold text-slate-900">{booking.providerId?.name}</div>
            {booking.providerId?.phone && (
              <div className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {booking.providerId.phone}
              </div>
            )}
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
              {t('bookings.notesHeading')}
            </span>
            {booking.notes}
          </div>
        )}

        {booking.providerNote && (
          <div className="text-sm bg-forest-50 rounded-2xl p-4 border border-forest-200">
            <span className="text-xs font-bold uppercase text-forest-700 block mb-1">
              {t('bookings.statusTimeline')}
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
              {t('bookings.cancelBooking')}
            </button>
          </div>
        )}

        {(isProvider || user?.role === 'admin') &&
          (booking.status === 'Pending' || booking.status === 'Accepted') && (
            <div className="pt-4 border-t border-earth-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                {t('bookings.notesHeading')}
              </label>
              <input
                type="text"
                value={providerNote}
                onChange={(e) => setProviderNote(e.target.value)}
                placeholder={t('marketplace.notesPlaceholder')}
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
                      <Check className="w-4 h-4" /> {t('provider.acceptBookingBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus('Rejected')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
                    >
                      <X className="w-4 h-4" /> {t('provider.rejectBookingBtn')}
                    </button>
                  </>
                )}
                {booking.status === 'Accepted' && (
                  <button
                    type="button"
                    onClick={() => updateStatus('Completed')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold"
                  >
                    <Check className="w-4 h-4" /> {t('provider.completeBookingBtn')}
                  </button>
                )}
              </div>
            </div>
          )}
      </div>

      <ReviewsSection
        bookingId={booking._id}
        reviewedUserId={isFarmer ? booking.providerId?._id : booking.farmerId?._id}
        canSubmitReview={Boolean((isFarmer || isProvider) && booking.status === 'Completed')}
      />
    </div>
  );
}
