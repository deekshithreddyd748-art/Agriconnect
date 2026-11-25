import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Check, X, Eye, Inbox } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/distance';

export default function ProviderBookingsPage({ initialStatus = 'All' }) {
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  function loadBookings() {
    setLoading(true);
    api
      .get('/bookings', { params: { status: statusFilter } })
      .then((res) => setBookings(res.data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  async function handleAction(id, status) {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(
        t('labourRequest.bookingUpdatedMsg', { status: t(`statuses.${status}`, status) })
      );
      loadBookings();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    }
  }

  const tabs = ['All', 'Pending', 'Accepted', 'Completed', 'Rejected', 'Cancelled'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-forest-900 flex items-center gap-2">
          <Inbox className="w-7 h-7 text-forest-700" />
          {t('provider.bookingsTitle')}
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">{t('provider.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-white border border-earth-200 p-1.5 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
              statusFilter === tab
                ? 'bg-forest-700 text-white'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            {tab === 'All' ? t('bookings.allFilter') : t(`statuses.${tab}`, tab)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">{t('common.loading')}</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-200 p-10 text-center text-sm text-slate-600">
          {t('provider.noIncomingBookings')}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookingStatusBadge status={b.status} />
                  <span className="text-xs text-slate-500">
                    {formatDate(b.bookingDate, i18n.language)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{b.serviceName}</h3>
                <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    {t('bookings.farmerLabel')}: <strong>{b.farmerId?.name}</strong> (
                    {b.farmerId?.phone})
                  </span>
                  <span>
                    {t('common.address')}:{' '}
                    <strong>{b.farmLocation?.address || b.farmerId?.village}</strong>
                  </span>
                  <span>
                    {t('bookings.amountLabel')}:{' '}
                    <strong>{formatCurrency(b.estimatedCost, i18n.language)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {b.status === 'Pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAction(b._id, 'Accepted')}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold"
                    >
                      <Check className="w-3.5 h-3.5" /> {t('provider.acceptBookingBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(b._id, 'Rejected')}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                    >
                      <X className="w-3.5 h-3.5" /> {t('provider.rejectBookingBtn')}
                    </button>
                  </>
                )}
                {b.status === 'Accepted' && (
                  <button
                    type="button"
                    onClick={() => handleAction(b._id, 'Completed')}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" /> {t('provider.completeBookingBtn')}
                  </button>
                )}
                <Link
                  to={`/bookings/${b._id}`}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-earth-100 text-slate-700 hover:bg-earth-200 text-xs font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" /> {t('common.viewDetails')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
