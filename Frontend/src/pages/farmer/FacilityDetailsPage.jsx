import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Phone, Warehouse, Clock, CheckCircle2, Flag } from 'lucide-react';
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

export default function FacilityDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { coords, hasCoords } = useLocationContext();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bookingDate, setBookingDate] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [duration, setDuration] = useState(7);
  const [selectedService, setSelectedService] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api
      .get(`/facilities/${id}`, {
        params: hasCoords ? { lat: coords.lat, lng: coords.lng } : {},
      })
      .then((res) => {
        const data = res.data.data;
        setItem(data);
        if (data?.servicesOffered?.length > 0) {
          setSelectedService(data.servicesOffered[0]);
        }
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id, coords?.lat, coords?.lng, hasCoords]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">{t('common.loading')}</div>
    );
  }
  if (!item) {
    return (
      <div className="py-16 text-center text-sm text-slate-600">
        {t('common.noResults')}
      </div>
    );
  }

  const estimatedCost =
    Number(item.price || 0) *
    Math.max(1, Number(quantity) || 1) *
    Math.max(1, Number(duration) || 1);

  const capPct = Math.min(
    100,
    Math.round(((item.availableCapacity || 0) / Math.max(1, item.capacity || 1)) * 100)
  );

  async function handleReserve(e) {
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
        serviceType: 'facility',
        serviceId: item._id,
        bookingDate,
        quantity: Number(quantity),
        duration: Number(duration),
        durationUnit: 'day',
        selectedService,
        farmLocation: {
          address: user.location?.address || user.village,
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
      await api.post(`/discovery/report/facility/${item._id}`, { reason });
      toast.success(t('common.saveSuccess'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/facilities"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> {t('marketplace.backToList')}
        </Link>
        <div className="flex items-center gap-2">
          <FavouriteButton listingType="facility" listingId={item._id} />
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
              className="w-full h-64 object-cover bg-earth-100"
            />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                  {t(`categories.facility.${item.category}`, item.category)}
                </span>
                <AvailabilityBadge available={item.availability} />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-forest-900">
                {item.name}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>

              <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{t('marketplace.capacityLabel')}</span>
                  <span>
                    {item.availableCapacity} / {item.capacity} {item.capacityUnit} ({capPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-earth-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-600 rounded-full"
                    style={{ width: `${capPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <div className="text-slate-500">{t('provider.rateLabel')}</div>
                  <div className="font-bold text-forest-900 text-sm">
                    {formatCurrency(item.price, i18n.language)} {item.priceUnit}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <div className="text-slate-500">{t('labourRequest.hoursLabel')}</div>
                  <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> {item.operatingHours}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <div className="text-slate-500">{t('nav.nearbyMap')}</div>
                  <div className="font-bold text-forest-700">
                    {formatDistanceLabel(item)}
                  </div>
                </div>
              </div>

              {item.servicesOffered?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1.5">
                    {t('nav.services')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.servicesOffered.map((srv) => (
                      <span
                        key={srv}
                        className="px-2.5 py-1 rounded-lg bg-forest-50 text-forest-800 text-xs font-medium"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-earth-200 flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <div className="font-semibold text-slate-900">
                    {t('marketplace.ownerLabel')}: {item.operatorId?.name}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.location?.address ||
                      [item.location?.village, item.location?.district]
                        .filter(Boolean)
                        .join(', ')}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 text-forest-800 text-xs font-semibold">
                  <Phone className="w-3.5 h-3.5" />
                  {item.contactPhone || item.operatorId?.phone}
                </span>
              </div>
            </div>
          </div>

          {hasValidCoords(item.location) && (
            <ServiceMap
              items={[item]}
              userCoords={hasCoords ? coords : null}
              radiusKm={25}
              defaultType="facility"
              height="280px"
            />
          )}

          <ReviewsSection reviewedUserId={item.operatorId?._id || item.owner_id} />
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-earth-200 p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-sky-700" />
              {t('marketplace.bookFacilityTitle')}
            </h2>

            {!item.availability || item.availableCapacity <= 0 ? (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-sm">
                {t('common.unavailable')}
              </div>
            ) : (
              <form onSubmit={handleReserve} className="space-y-4">
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

                {item.servicesOffered?.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('nav.services')}
                    </label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm bg-white"
                    >
                      {item.servicesOffered.map((srv) => (
                        <option key={srv} value={srv}>
                          {srv}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('marketplace.tonnageLabel')} ({item.capacityUnit}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={item.availableCapacity}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('labourRequest.durationLabel')} *
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

                <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-forest-800 font-medium">
                      {t('marketplace.bookingTotal')}
                    </span>
                    <span className="text-xl font-extrabold text-forest-900">
                      {formatCurrency(estimatedCost, i18n.language)}
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('marketplace.loginToBook')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm disabled:opacity-60"
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
