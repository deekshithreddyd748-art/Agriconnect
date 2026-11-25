import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, List, Map as MapIcon, Tractor } from 'lucide-react';
import api from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';
import LocationSelector from '../../components/LocationSelector';
import ServiceMap from '../../components/ServiceMap';
import { AvailabilityBadge } from '../../components/StatusBadge';
import { EQUIPMENT_CATEGORIES } from '../../utils/constants';
import {
  formatCurrency,
  formatDistanceLabel,
  resolveImageUrl,
} from '../../utils/distance';

export default function MachineryMarketplace() {
  const { coords, hasCoords, radius, regionFilter } = useLocationContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [category, setCategory] = useState('All');
  const [district, setDistrict] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availability, setAvailability] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const effectiveDistrict = district || (!hasCoords ? regionFilter.district : '');
    const params = {
      category,
      district: effectiveDistrict,
      search,
      maxPrice,
      availability,
      ...(hasCoords ? { lat: coords.lat, lng: coords.lng, radius } : {}),
    };
    api
      .get('/equipment', { params })
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [
    category,
    district,
    maxPrice,
    availability,
    search,
    coords?.lat,
    coords?.lng,
    hasCoords,
    radius,
    regionFilter.district,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900 flex items-center gap-2">
            <Tractor className="w-7 h-7 text-forest-700" />
            Agricultural Machinery Marketplace
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Compare nearby tractors, harvesters, rotavators, and irrigation equipment.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-earth-200 bg-white p-1 self-start">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              viewMode === 'list'
                ? 'bg-forest-700 text-white'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            <List className="w-4 h-4" /> List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              viewMode === 'map'
                ? 'bg-forest-700 text-white'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            <MapIcon className="w-4 h-4" /> Map View
          </button>
        </div>
      </div>

      <LocationSelector />

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-earth-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tractor, village..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-earth-200 text-sm"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-earth-200 text-sm bg-white"
        >
          <option value="All">All Categories</option>
          {EQUIPMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="Filter by district (e.g. Pune)"
          className="px-3 py-2 rounded-xl border border-earth-200 text-sm"
        />

        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max price (₹)"
          className="px-3 py-2 rounded-xl border border-earth-200 text-sm"
        />

        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="px-3 py-2 rounded-xl border border-earth-200 text-sm bg-white"
        >
          <option value="">All Availability</option>
          <option value="true">Available Only</option>
          <option value="false">Currently Unavailable</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Loading nearby machinery...
        </div>
      ) : viewMode === 'map' ? (
        <ServiceMap
          items={items}
          userCoords={hasCoords ? coords : null}
          radiusKm={radius}
          defaultType="equipment"
          height="520px"
        />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-200 p-10 text-center space-y-2">
          <p className="font-semibold text-slate-800">
            No machinery matched your filters in this radius.
          </p>
          <p className="text-xs text-slate-500">
            Try expanding the distance radius to 25 km or selecting &quot;Any distance&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-earth-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="h-44 bg-earth-100 relative overflow-hidden">
                  <img
                    src={resolveImageUrl(item.images?.[0])}
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder.svg';
                    }}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <AvailabilityBadge available={item.availability} />
                  </div>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-fresh-600">
                    {item.category}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="pt-1 space-y-1 text-xs text-slate-600">
                    <div>
                      Owner:{' '}
                      <span className="font-semibold text-slate-800">
                        {item.ownerId?.name || 'Local Owner'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-forest-700 font-semibold">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {[item.location?.village, item.location?.district]
                          .filter(Boolean)
                          .join(', ') || 'Location pending'}{' '}
                        · {formatDistanceLabel(item)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-earth-50 border-t border-earth-200 flex items-center justify-between">
                <div>
                  <span className="text-lg font-extrabold text-forest-900">
                    {formatCurrency(item.price)}
                  </span>
                  <span className="text-xs text-slate-500"> / {item.priceUnit}</span>
                </div>
                <Link
                  to={`/machinery/${item._id}`}
                  className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold"
                >
                  {item.availability ? 'View & Book' : 'View Details'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
