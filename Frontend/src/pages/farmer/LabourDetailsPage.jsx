import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Phone, Users, CheckCircle2, Flag } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import ServiceMap from '../../components/ServiceMap';
import { AvailabilityBadge } from '../../components/StatusBadge';
import {
  formatCurrency,
  formatDistanceLabel,
  hasValidCoords,
} from '../../utils/distance';

export default function LabourDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coords, hasCoords } = useLocationContext();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bookingDate, setBookingDate] = useState('');
  const [workersRequested, setWorkersRequested] = useState(4);
  const [duration, setDuration] = useState(1);
  const [farmAddress, setFarmAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api
      .get(`/labour/${id}`, {
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
    return <div className="py-16 text-center text-sm text-slate-500">Loading labour crew...</div>;
  }
  if (!item) {
    return (
      <div className="py-16 text-center text-sm text-slate-600">
        Labour listing not found.
      </div>
    );
  }

  const estimatedCost =
    Number(item.pricePerWorker || 0) *
    Math.max(1, Number(workersRequested) || 1) *
    Math.max(1, Number(duration) || 1);

  async function handleBook(e) {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in as a farmer to book labour.');
      navigate('/login');
      return;
    }
    if (user.role !== 'farmer' && user.role !== 'admin') {
      toast.error('Only farmer accounts can request labour.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        serviceType: 'labour',
        serviceId: item._id,
        bookingDate,
        workersRequested: Number(workersRequested),
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
      toast.success('Labour request submitted!');
      navigate(`/bookings/${res.data.data._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit labour request.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReport() {
    const reason = window.prompt('Describe why you are reporting this listing:');
    if (!reason || !reason.trim()) return;
    try {
      await api.post(`/discovery/report/labour/${item._id}`, { reason });
      toast.success('Listing flagged for admin review.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit report.'));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/labour"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Labour Discovery
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
          <div className="bg-white rounded-3xl border border-earth-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-harvest-100 text-harvest-700 text-xs font-bold">
                {item.category}
              </span>
              <AvailabilityBadge available={item.availability} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-forest-900">
              {item.title || `${item.category} Team`}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>

            {(item.skills?.length > 0 || item.experience) && (
              <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 space-y-2">
                {item.experience && (
                  <div className="text-xs text-slate-700">
                    Experience: <strong>{item.experience}</strong>
                  </div>
                )}
                {item.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.skills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-1 rounded-lg bg-white border border-earth-200 text-xs font-semibold text-forest-800"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                <div className="text-[11px] text-slate-500">Workers Available</div>
                <div className="font-bold text-forest-900 text-lg">
                  {item.workersAvailable}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                <div className="text-[11px] text-slate-500">Rate / Worker</div>
                <div className="font-bold text-forest-900">
                  {formatCurrency(item.pricePerWorker)} / {item.priceUnit}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                <div className="text-[11px] text-slate-500">Distance</div>
                <div className="font-bold text-forest-700">
                  {formatDistanceLabel(item)}
                </div>
              </div>
            </div>

            {item.availableDates?.length > 0 && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800 block mb-1">
                  Upcoming Available Dates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.availableDates.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-lg bg-forest-50 text-forest-800 font-medium"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-earth-200 flex flex-wrap justify-between gap-2 text-sm">
              <div>
                <div className="font-semibold text-slate-900">
                  Provider: {item.providerId?.name}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {item.location?.address ||
                    [item.location?.village, item.location?.district]
                      .filter(Boolean)
                      .join(', ')}
                </div>
              </div>
              {item.providerId?.phone && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 text-forest-800 text-xs font-semibold">
                  <Phone className="w-3.5 h-3.5" />
                  {item.providerId.phone}
                </span>
              )}
            </div>
          </div>

          {hasValidCoords(item.location) && (
            <ServiceMap
              items={[item]}
              userCoords={hasCoords ? coords : null}
              radiusKm={item.serviceRadius || 15}
              defaultType="labour"
              height="280px"
            />
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-earth-200 p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-harvest-600" />
              Request Farm Labour
            </h2>

            {!item.availability ? (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-sm">
                This labour crew is currently marked unavailable.
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Workers Needed (Max {item.workersAvailable}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={item.workersAvailable}
                      required
                      value={workersRequested}
                      onChange={(e) => setWorkersRequested(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duration ({item.priceUnit}s) *
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
                    Farm Location *
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
                    Work Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Crop, acreage, shift start time..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-forest-800 font-medium">Estimated Cost</span>
                    <span className="text-xl font-extrabold text-forest-900">
                      {formatCurrency(estimatedCost)}
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Direct settlement upon work completion.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Labour Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
