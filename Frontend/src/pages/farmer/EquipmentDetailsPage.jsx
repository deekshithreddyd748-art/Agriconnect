import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Flag,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import ServiceMap from '../../components/ServiceMap';
import { AvailabilityBadge } from '../../components/StatusBadge';
import FavouriteButton from '../../components/FavouriteButton';
import ReviewsSection from '../../components/ReviewsSection';
import {
  formatCurrency,
  formatDistanceLabel,
  hasValidCoords,
  resolveImageUrl,
} from '../../utils/distance';

export default function EquipmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { coords, hasCoords } = useLocationContext();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bookingDate, setBookingDate] = useState('');
  const [duration, setDuration] = useState(2);
  const [farmAddress, setFarmAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get(`/equipment/${id}`, {
        params: hasCoords ? { lat: coords.lat, lng: coords.lng } : {},
      })
      .then((res) => setItem(res.data.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id, coords?.lat, coords?.lng, hasCoords]);

  useEffect(() => {
    if (user && !farmAddress) {
      setFarmAddress(
        user.location?.address ||
          [user.village, user.district, user.state].filter(Boolean).join(', ')
      );
    }
  }, [user, farmAddress]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">{t('common.loading')}</div>
    );
  }
  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="font-bold text-slate-800">{t('common.noResults')}</p>
        <Link to="/machinery" className="text-forest-700 font-semibold text-sm hover:underline">
          {t('marketplace.backToList')}
        </Link>
      </div>
    );
  }

  const estimatedCost = Number(item.price || 0) * Math.max(1, Number(duration) || 1);

  async function handleBook(e) {
    e.preventDefault();
    if (!user) {
      toast.error(t('marketplace.loginToBook'));
      navigate('/login');
      return;
    }
    if (user.role !== 'farmer' && user.role !== 'admin') {
      toast.error(t('marketplace.loginToBook'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        serviceType: 'equipment',
        serviceId: item._id,
        bookingDate,
        duration: Number(duration),
        durationUnit: item.priceUnit,
        farmLocation: {
          address: farmAddress,
          village: user.village,
          district: user.district,
          lat: hasCoords ? coords.lat : null,
          lng: hasCoords ? coords.lng : null,
        },
        notes,
      });
      toast.success(
        t('marketplace.bookingCreated', {
          code: res.data.data?.bookingCode || res.data.data?._id,
        })
      );
      navigate(`/bookings/${res.data.data._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, t('marketplace.bookingFailed')));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReport() {
    const reason = window.prompt(t('bookings.notesHeading'));
    if (!reason || !reason.trim()) return;
    try {
      await api.post(`/discovery/report/equipment/${item._id}`, { reason });
      toast.success(t('common.saveSuccess'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/machinery"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> {t('marketplace.backToList')}
        </Link>
        <div className="flex items-center gap-2">
          <FavouriteButton listingType="equipment" listingId={item._id} />
          {user && (
            <button
              type="button"
              onClick={handleReport}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600"
            >
              <Flag className="w-3.5 h-3.5" /> !
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-earth-200 overflow-hidden shadow-sm">
            <img
              src={resolveImageUrl(item.images?.[0])}
              onError={(e) => {
                e.currentTarget.src = '/images/placeholder.svg';
              }}
              alt={item.name}
              className="w-full h-72 object-cover bg-earth-100"
            />
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
                  {t(`categories.equipment.${item.category}`, item.category)}
                </span>
                <AvailabilityBadge available={item.availability} />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-forest-900">
                {item.name}
              </h1>

              <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <div className="text-[11px] text-slate-500">{t('provider.rateLabel')}</div>
                  <div className="font-bold text-forest-900">
                    {formatCurrency(item.price, i18n.language)} / {item.priceUnit}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <div className="text-[11px] text-slate-500">{t('gps.radiusLabel')}</div>
                  <div className="font-bold text-slate-800">{item.serviceRadius} km</div>
                </div>
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <div className="text-[11px] text-slate-500">{t('nav.nearbyMap')}</div>
                  <div className="font-bold text-forest-700">
                    {formatDistanceLabel(item)}
                  </div>
                </div>
              </div>

              {item.specifications &&
                (item.specifications.brand ||
                  item.specifications.horsepower ||
                  item.specifications.year) && (
                  <div className="pt-2 border-t border-earth-200 text-xs text-slate-600 flex flex-wrap gap-4">
                    {item.specifications.brand && (
                      <span>
                        <strong>{item.specifications.brand}</strong>
                      </span>
                    )}
                    {item.specifications.horsepower && (
                      <span>
                        <strong>{item.specifications.horsepower}</strong>
                      </span>
                    )}
                    {item.specifications.year && (
                      <span>
                        <strong>{item.specifications.year}</strong>
                      </span>
                    )}
                  </div>
                )}

              <div className="pt-3 border-t border-earth-200 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold text-slate-900">
                    {t('marketplace.ownerLabel')}: {item.ownerId?.name}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.location?.address ||
                      [item.location?.village, item.location?.district, item.location?.state]
                        .filter(Boolean)
                        .join(', ')}
                  </div>
                </div>
                {item.ownerId?.phone && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 text-forest-800 text-xs font-semibold">
                    <Phone className="w-3.5 h-3.5" />
                    {item.ownerId.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {hasValidCoords(item.location) ? (
            <ServiceMap
              items={[item]}
              userCoords={hasCoords ? coords : null}
              radiusKm={item.serviceRadius || 15}
              defaultType="equipment"
              height="300px"
            />
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {t('common.locationUnavailable')}
            </div>
          )}

          <ReviewsSection reviewedUserId={item.ownerId?._id || item.owner_id} />
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-earth-200 p-6 shadow-sm sticky top-24 space-y-5">
            <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-forest-700" />
              {t('marketplace.bookEquipmentTitle')}
            </h2>

            {!item.availability ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 space-y-1">
                <div className="font-bold">{t('common.unavailable')}</div>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('marketplace.startDate')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('marketplace.quantityDays')} ({item.priceUnit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('common.address')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmAddress}
                    onChange={(e) => setFarmAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('marketplace.notesLabel')}
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('marketplace.notesPlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-forest-800 font-medium">
                      {t('marketplace.bookingTotal')}
                    </span>
                    <span className="text-xl font-extrabold text-forest-900">
                      {formatCurrency(estimatedCost, i18n.language)}
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {t('marketplace.loginToBook')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {submitting
                    ? t('marketplace.submittingBooking')
                    : t('marketplace.confirmBookingBtn')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
