import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CalendarCheck, XCircle, Eye } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { BookingStatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/distance';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Completed', 'Rejected', 'Cancelled'];

export default function MyBookingsPage() {
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

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

  async function handleCancel(bookingId) {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: 'Cancelled' });
      toast.success(t('bookings.cancelSuccess'));
      loadBookings();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900 flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-forest-700" />
            {t('bookings.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">{t('bookings.subtitle')}</p>
        </div>

        <Link
          to="/services"
          className="px-4 py-2 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800 w-fit"
        >
          {t('nav.services')}
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-white border border-earth-200 p-1.5 rounded-2xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
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
        <div className="bg-white rounded-2xl border border-earth-200 p-10 text-center space-y-2">
          <p className="font-semibold text-slate-800">{t('bookings.noBookings')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-earth-100 text-slate-700 text-[11px] font-bold uppercase">
                    {t(`bookings.${b.serviceType}Type`, b.serviceType)}
                  </span>
                  <BookingStatusBadge status={b.status} />
                </div>
                <h3 className="text-base font-bold text-slate-900">{b.serviceName}</h3>
                <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    {t('common.date')}: <strong>{formatDate(b.bookingDate, i18n.language)}</strong>
                  </span>
                  <span>
                    {t('bookings.providerLabel')}: <strong>{b.providerId?.name}</strong>
                  </span>
                  <span>
                    {t('bookings.amountLabel')}:{' '}
                    <strong>{formatCurrency(b.estimatedCost, i18n.language)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {b.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(b._id)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                  >
                    <XCircle className="w-3.5 h-3.5" /> {t('bookings.cancelBooking')}
                  </button>
                )}
                <Link
                  to={`/bookings/${b._id}`}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-forest-50 text-forest-800 hover:bg-forest-100 text-xs font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" /> {t('bookings.viewDetails')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
