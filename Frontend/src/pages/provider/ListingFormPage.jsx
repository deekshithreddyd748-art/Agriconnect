import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  EQUIPMENT_CATEGORIES,
  FACILITY_CATEGORIES,
  LABOUR_CATEGORIES,
} from '../../utils/constants';
import CurrentLocationPicker from '../../components/location/CurrentLocationPicker';

const ROLE_TO_TYPE = {
  equipment_owner: 'equipment',
  labour_provider: 'labour',
  facility_operator: 'facility',
};

const TYPE_TO_ENDPOINT = {
  equipment: '/equipment',
  labour: '/labour',
  facility: '/facilities',
};

export default function ListingFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { type: paramType, id } = useParams();

  const listingType = paramType || ROLE_TO_TYPE[user?.role] || 'equipment';
  const endpoint = TYPE_TO_ENDPOINT[listingType];
  const isEdit = Boolean(id);

  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);

  const [form, setForm] = useState({
    name: '',
    title: '',
    category:
      listingType === 'equipment'
        ? EQUIPMENT_CATEGORIES[0]
        : listingType === 'labour'
          ? LABOUR_CATEGORIES[0]
          : FACILITY_CATEGORIES[0],
    description: '',
    skills: '',
    experience: '',
    price: '',
    pricePerWorker: '',
    priceUnit:
      listingType === 'facility'
        ? 'per ton/day'
        : listingType === 'labour'
          ? 'day'
          : 'hour',
    workersAvailable: 5,
    availableDates: '',
    capacity: 100,
    availableCapacity: 100,
    capacityUnit: 'tons',
    operatingHours: '06:00 AM - 08:00 PM',
    servicesOffered: '',
    contactPhone: user?.phone || '',
    serviceRadius: 15,
    availability: true,
    brand: '',
    horsepower: '',
    year: '',
    village: user?.village || '',
    district: user?.district || '',
    state: user?.state || '',
    address: user?.location?.address || '',
    lat: user?.location?.lat ?? null,
    lng: user?.location?.lng ?? null,
  });

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`${endpoint}/${id}`)
      .then((res) => {
        const d = res.data.data;
        setForm((prev) => ({
          ...prev,
          name: d.name || '',
          title: d.title || '',
          category: d.category || prev.category,
          description: d.description || '',
          skills: (d.skills || []).join(', '),
          experience: d.experience || '',
          price: d.price ?? '',
          pricePerWorker: d.pricePerWorker ?? '',
          priceUnit: d.priceUnit || prev.priceUnit,
          workersAvailable: d.workersAvailable ?? 5,
          availableDates: (d.availableDates || []).join(', '),
          capacity: d.capacity ?? 100,
          availableCapacity: d.availableCapacity ?? 100,
          capacityUnit: d.capacityUnit || 'tons',
          operatingHours: d.operatingHours || '06:00 AM - 08:00 PM',
          servicesOffered: (d.servicesOffered || []).join(', '),
          contactPhone: d.contactPhone || '',
          serviceRadius: d.serviceRadius ?? 15,
          availability: Boolean(d.availability),
          brand: d.specifications?.brand || '',
          horsepower: d.specifications?.horsepower || '',
          year: d.specifications?.year || '',
          village: d.location?.village || '',
          district: d.location?.district || '',
          state: d.location?.state || '',
          address: d.location?.address || '',
          lat: d.location?.lat ?? null,
          lng: d.location?.lng ?? null,
        }));
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Could not load listing.')));
  }, [isEdit, endpoint, id]);

  function updateField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleGpsCaptured(loc) {
    setForm((prev) => ({
      ...prev,
      lat: loc.lat,
      lng: loc.lng,
      village: loc.village || prev.village,
      district: loc.district || prev.district,
      state: loc.state || prev.state,
      address: loc.formattedAddress || prev.address,
    }));
  }

  function handleRegionFallback(region) {
    setForm((prev) => ({
      ...prev,
      village: region.village,
      district: region.district,
      state: region.state,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const locationObj = {
      village: form.village,
      district: form.district,
      state: form.state,
      address: form.address,
      lat: form.lat,
      lng: form.lng,
    };

    try {
      if (listingType === 'labour') {
        const payload = {
          title: form.title,
          category: form.category,
          description: form.description,
          skills: form.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          experience: form.experience,
          workersAvailable: Number(form.workersAvailable),
          pricePerWorker: Number(form.pricePerWorker),
          priceUnit: form.priceUnit,
          availability: form.availability,
          serviceRadius: Number(form.serviceRadius),
          availableDates: form.availableDates
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          location: locationObj,
        };
        if (isEdit) await api.put(`${endpoint}/${id}`, payload);
        else await api.post(endpoint, payload);
      } else {
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('category', form.category);
        fd.append('description', form.description);
        fd.append('price', form.price);
        fd.append('priceUnit', form.priceUnit);
        fd.append('availability', String(form.availability));
        fd.append('location', JSON.stringify(locationObj));

        if (listingType === 'equipment') {
          fd.append('serviceRadius', String(form.serviceRadius));
          fd.append(
            'specifications',
            JSON.stringify({
              brand: form.brand,
              horsepower: form.horsepower,
              year: form.year,
            })
          );
        } else {
          fd.append('capacity', String(form.capacity));
          fd.append('availableCapacity', String(form.availableCapacity));
          fd.append('capacityUnit', form.capacityUnit);
          fd.append('operatingHours', form.operatingHours);
          fd.append('contactPhone', form.contactPhone);
          fd.append(
            'servicesOffered',
            JSON.stringify(
              form.servicesOffered
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          );
        }

        files.forEach((f) => fd.append('images', f));

        if (isEdit) await api.put(`${endpoint}/${id}`, fd);
        else await api.post(endpoint, fd);
      }

      toast.success(isEdit ? 'Listing updated!' : 'New listing published!');
      navigate('/provider/listings');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save listing.'));
    } finally {
      setSaving(false);
    }
  }

  const categories =
    listingType === 'equipment'
      ? EQUIPMENT_CATEGORIES
      : listingType === 'labour'
        ? LABOUR_CATEGORIES
        : FACILITY_CATEGORIES;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/provider/listings"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Listings
      </Link>

      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-forest-900 mb-6">
          {isEdit ? 'Edit' : 'Add New'}{' '}
          {listingType === 'equipment'
            ? 'Equipment Listing'
            : listingType === 'labour'
              ? 'Labour Team Listing'
              : 'Post-Harvest Facility'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {listingType === 'labour' ? 'Team / Profile Title *' : 'Listing Name *'}
              </label>
              <input
                type="text"
                required
                value={listingType === 'labour' ? form.title : form.name}
                onChange={(e) =>
                  updateField(
                    listingType === 'labour' ? 'title' : 'name',
                    e.target.value
                  )
                }
                placeholder={
                  listingType === 'equipment'
                    ? 'e.g., John Deere 5310 Tractor'
                    : listingType === 'labour'
                      ? 'e.g., GreenHarvest 12-Member Squad'
                      : 'e.g., Sahyadri Cold Storage'
                }
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              rows={3}
              required
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-earth-200 text-sm"
            />
          </div>

          {listingType === 'equipment' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rental Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pricing Unit *
                </label>
                <select
                  value={form.priceUnit}
                  onChange={(e) => updateField('priceUnit', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm bg-white"
                >
                  <option value="hour">per hour</option>
                  <option value="day">per day</option>
                  <option value="acre">per acre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Radius (km)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.serviceRadius}
                  onChange={(e) => updateField('serviceRadius', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Horsepower / Capacity
                </label>
                <input
                  type="text"
                  value={form.horsepower}
                  onChange={(e) => updateField('horsepower', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Year
                </label>
                <input
                  type="text"
                  value={form.year}
                  onChange={(e) => updateField('year', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
            </div>
          )}

          {listingType === 'labour' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workers Available *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.workersAvailable}
                  onChange={(e) => updateField('workersAvailable', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wage Per Worker (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.pricePerWorker}
                  onChange={(e) => updateField('pricePerWorker', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wage Unit
                </label>
                <select
                  value={form.priceUnit}
                  onChange={(e) => updateField('priceUnit', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm bg-white"
                >
                  <option value="day">per day</option>
                  <option value="hour">per hour</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Experience
                </label>
                <input
                  type="text"
                  value={form.experience}
                  onChange={(e) => updateField('experience', e.target.value)}
                  placeholder="e.g., 6+ years harvesting & nursery"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => updateField('skills', e.target.value)}
                  placeholder="Sugarcane Cutting, Paddy Transplanting, Pruning"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available Dates (comma-separated YYYY-MM-DD)
                </label>
                <input
                  type="text"
                  value={form.availableDates}
                  onChange={(e) => updateField('availableDates', e.target.value)}
                  placeholder="2026-11-28, 2026-11-29"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
            </div>
          )}

          {listingType === 'facility' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.capacity}
                  onChange={(e) => updateField('capacity', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available Capacity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.availableCapacity}
                  onChange={(e) => updateField('availableCapacity', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capacity Unit
                </label>
                <input
                  type="text"
                  value={form.capacityUnit}
                  onChange={(e) => updateField('capacityUnit', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Charge (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Charge Unit
                </label>
                <input
                  type="text"
                  value={form.priceUnit}
                  onChange={(e) => updateField('priceUnit', e.target.value)}
                  placeholder="per ton/day"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={form.operatingHours}
                  onChange={(e) => updateField('operatingHours', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Services Offered (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.servicesOffered}
                  onChange={(e) => updateField('servicesOffered', e.target.value)}
                  placeholder="Cold Storage, Pre-cooling, Grading"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-earth-200 text-sm"
                />
              </div>
            </div>
          )}

          {listingType !== 'labour' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Images (JPG / PNG / WebP, max 5)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-forest-50 file:text-forest-800 file:font-semibold hover:file:bg-forest-100"
              />
            </div>
          )}

          <div className="pt-3 border-t border-earth-200 space-y-4">
            <CurrentLocationPicker
              title="Service GPS Location (Uses Saved Profile GPS or Tap to Refresh)"
              initialLocation={{
                lat: form.lat,
                lng: form.lng,
                village: form.village,
                district: form.district,
                state: form.state,
                address: form.address,
              }}
              onLocationCaptured={handleGpsCaptured}
              onRegionFallbackChange={handleRegionFallback}
              showMapPreview
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Village"
                value={form.village}
                onChange={(e) => updateField('village', e.target.value)}
                className="min-h-[44px] px-3 rounded-xl border border-earth-200 text-sm"
              />
              <input
                type="text"
                placeholder="District"
                value={form.district}
                onChange={(e) => updateField('district', e.target.value)}
                className="min-h-[44px] px-3 rounded-xl border border-earth-200 text-sm"
              />
              <input
                type="text"
                placeholder="State"
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="min-h-[44px] px-3 rounded-xl border border-earth-200 text-sm"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.availability}
              onChange={(e) => updateField('availability', e.target.checked)}
              className="rounded border-earth-200 text-forest-700 focus:ring-forest-500"
            />
            Listing is currently available for bookings
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Listing...' : isEdit ? 'Save Changes' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
