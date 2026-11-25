import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
      .then((res) => {
        setItem(res.data.data);
      })
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
    return <div className="py-16 text-center text-sm text-slate-500">Loading equipment...</div>;
  }
  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="font-bold text-slate-800">Equipment listing not found.</p>
        <Link to="/machinery" className="text-forest-700 font-semibold text-sm hover:underline">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const estimatedCost = Number(item.price || 0) * Math.max(1, Number(duration) || 1);

  async function handleBook(e) {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in as a farmer to submit a booking request.');
      navigate('/login');
      return;
    }
    if (user.role !== 'farmer' && user.role !== 'admin') {
      toast.error('Only farmer accounts can request equipment bookings.');
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
      toast.success('Booking request sent to equipment owner!');
      navigate(`/bookings/${res.data.data._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit booking.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReport() {
    const reason = window.prompt('Describe why you are reporting this listing:');
    if (!reason || !reason.trim()) return;
    try {
      await api.post(`/discovery/report/equipment/${item._id}`, { reason });
      toast.success('Listing flagged for admin review.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit report.'));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/machinery"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Machinery Marketplace
        </Link>
        {user && (
          <button
            type="button"
            onClick={handleReport}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600"
          >
            <Flag className="w-3.5 h-3.5" /> Report Listing
          </button>
        )}
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
                  {item.category}
                </span>
                <AvailabilityBadge available={item.availability} />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-forest-900">
                {item.name}
              </h1>

              <p className="text-slate-600 text-sm leading-relaxed">
                {item.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <div className="text-[11px] text-slate-500">Rental Rate</div>
                  <div className="font-bold text-forest-900">
                    {formatCurrency(item.price)} / {item.priceUnit}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <div className="text-[11px] text-slate-500">Service Radius</div>
                  <div className="font-bold text-slate-800">{item.serviceRadius} km</div>
                </div>
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <div className="text-[11px] text-slate-500">Distance</div>
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
                      <span>Brand: <strong>{item.specifications.brand}</strong></span>
                    )}
                    {item.specifications.horsepower && (
                      <span>Power: <strong>{item.specifications.horsepower}</strong></span>
                    )}
                    {item.specifications.year && (
                      <span>Year: <strong>{item.specifications.year}</strong></span>
                    )}
                  </div>
                )}

              <div className="pt-3 border-t border-earth-200 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold text-slate-900">
                    Owner: {item.ownerId?.name}
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
              Exact map coordinates are currently unavailable for this listing.
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-earth-200 p-6 shadow-sm sticky top-24 space-y-5">
            <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-forest-700" />
              Request Equipment Booking
            </h2>

            {!item.availability ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 space-y-1">
                <div className="font-bold">Currently Unavailable</div>
                <p className="text-xs">
                  This equipment is marked as unavailable by its owner. Booking
                  requests are disabled until availability is restored.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Required Date *
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
                    Duration (Number of {item.priceUnit}s) *
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
                    Farming Location / Plot Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmAddress}
                    onChange={(e) => setFarmAddress(e.target.value)}
                    placeholder="Village, Survey No. or landmark"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Crop type, soil condition, or operator preference..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-forest-800 font-medium">Estimated Cost</span>
                    <span className="text-xl font-extrabold text-forest-900">
                      {formatCurrency(estimatedCost)}
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-700 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    No online payment is charged now. Settle directly with the owner
                    via Cash or UPI after service delivery.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting Request...' : 'Submit Booking Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
