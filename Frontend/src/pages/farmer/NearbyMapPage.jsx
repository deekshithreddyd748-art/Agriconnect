import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Layers } from 'lucide-react';
import api from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';
import LocationSelector from '../../components/LocationSelector';
import ServiceMap from '../../components/ServiceMap';
import { formatDistanceLabel } from '../../utils/distance';

export default function NearbyMapPage() {
  const { coords, hasCoords, radius, regionFilter } = useLocationContext();
  const [serviceType, setServiceType] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/discovery/nearby', {
        params: {
          serviceType,
          ...(!hasCoords && regionFilter.district
            ? { district: regionFilter.district }
            : {}),
          ...(hasCoords ? { lat: coords.lat, lng: coords.lng, radius } : {}),
        },
      })
      .then((res) => setItems(res.data.data?.all || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [
    serviceType,
    coords?.lat,
    coords?.lng,
    hasCoords,
    radius,
    regionFilter.district,
  ]);

  const filterTabs = [
    { key: 'all', label: 'All Services' },
    { key: 'equipment', label: 'Machinery (M)' },
    { key: 'labour', label: 'Labour (L)' },
    { key: 'facility', label: 'Facilities (F)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-forest-700" />
            Nearby Agricultural Services Map
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Explore nearby machinery owners, labour crews, and post-harvest hubs sorted
            by Haversine distance.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-white border border-earth-200 p-1 rounded-xl">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setServiceType(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                serviceType === tab.key
                  ? 'bg-forest-700 text-white'
                  : 'text-slate-600 hover:bg-earth-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <LocationSelector />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ServiceMap
            items={items}
            userCoords={hasCoords ? coords : null}
            radiusKm={radius}
            height="540px"
          />
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-earth-200 p-4 shadow-sm max-h-[540px] overflow-y-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-earth-200">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-forest-700" />
              Nearby Results ({items.length})
            </h2>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 py-6 text-center">Searching nearby...</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No active services found within {radius > 0 ? `${radius} km` : 'this area'}.
            </p>
          ) : (
            items.map((item) => {
              const linkTo =
                item.serviceType === 'equipment'
                  ? `/machinery/${item._id}`
                  : item.serviceType === 'labour'
                    ? `/labour/${item._id}`
                    : `/facilities/${item._id}`;

              return (
                <Link
                  key={`${item.serviceType}-${item._id}`}
                  to={linkTo}
                  className="block p-3.5 rounded-xl border border-earth-200 hover:border-forest-500 hover:bg-earth-50 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="uppercase text-fresh-600">{item.category}</span>
                    <span className="text-forest-800">{formatDistanceLabel(item)}</span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    {item.displayTitle}
                  </div>
                  <div className="text-xs text-slate-600 flex justify-between">
                    <span>{item.providerName}</span>
                    <span className="font-semibold text-slate-800">{item.priceLabel}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
