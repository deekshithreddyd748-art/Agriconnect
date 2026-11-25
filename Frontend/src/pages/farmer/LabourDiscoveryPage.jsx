import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, MapPin, List, Map as MapIcon } from 'lucide-react';
import api from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';
import LocationSelector from '../../components/LocationSelector';
import ServiceMap from '../../components/ServiceMap';
import { AvailabilityBadge } from '../../components/StatusBadge';
import { LABOUR_CATEGORIES } from '../../utils/constants';
import { formatCurrency, formatDistanceLabel } from '../../utils/distance';

export default function LabourDiscoveryPage() {
  const { coords, hasCoords, radius } = useLocationContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [category, setCategory] = useState('All');
  const [minWorkers, setMinWorkers] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/labour', {
        params: {
          category,
          minWorkers,
          maxPrice,
          search,
          ...(hasCoords ? { lat: coords.lat, lng: coords.lng, radius } : {}),
        },
      })
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, minWorkers, maxPrice, search, coords?.lat, coords?.lng, hasCoords, radius]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-harvest-600" />
            Agricultural Labour Network
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Find skilled harvesting, sowing, weeding, and transplantation crews nearby.
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

      <div className="bg-white rounded-2xl border border-earth-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work type, village..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-earth-200 text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-earth-200 text-sm bg-white"
        >
          <option value="All">All Work Categories</option>
          {LABOUR_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={minWorkers}
          onChange={(e) => setMinWorkers(e.target.value)}
          placeholder="Min workers needed"
          className="px-3 py-2 rounded-xl border border-earth-200 text-sm"
        />
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max price / worker (₹)"
          className="px-3 py-2 rounded-xl border border-earth-200 text-sm"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Loading nearby labour teams...
        </div>
      ) : viewMode === 'map' ? (
        <ServiceMap
          items={items}
          userCoords={hasCoords ? coords : null}
          radiusKm={radius}
          defaultType="labour"
          height="500px"
        />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-200 p-10 text-center text-sm text-slate-600">
          No labour crews matched your filters in this radius.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-harvest-100 text-harvest-700 text-xs font-bold">
                    {item.category}
                  </span>
                  <AvailabilityBadge available={item.availability} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {item.title || `${item.category} Team`}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {item.description}
                </p>
                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  <div>
                    Coordinator:{' '}
                    <strong className="text-slate-800">
                      {item.providerId?.name || 'Local Provider'}
                    </strong>
                  </div>
                  <div>
                    Available Workers:{' '}
                    <strong className="text-forest-800">{item.workersAvailable}</strong>
                  </div>
                  <div className="flex items-center gap-1 text-forest-700 font-semibold">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {[item.location?.village, item.location?.district]
                      .filter(Boolean)
                      .join(', ')}{' '}
                    · {formatDistanceLabel(item)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-earth-200 flex items-center justify-between">
                <div>
                  <span className="text-lg font-extrabold text-forest-900">
                    {formatCurrency(item.pricePerWorker)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {' '}
                    / worker / {item.priceUnit}
                  </span>
                </div>
                <Link
                  to={`/labour/${item._id}`}
                  className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold"
                >
                  Request Team
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
