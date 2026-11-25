import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Edit3, Trash2, MapPin } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AvailabilityBadge } from '../../components/StatusBadge';
import { formatCurrency } from '../../utils/distance';

const ROLE_ENDPOINT = {
  equipment_owner: { endpoint: '/equipment', type: 'equipment', ownerParam: 'ownerId' },
  labour_provider: { endpoint: '/labour', type: 'labour', ownerParam: 'providerId' },
  facility_operator: { endpoint: '/facilities', type: 'facility', ownerParam: 'operatorId' },
};

export default function ProviderListingsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const cfg = ROLE_ENDPOINT[user?.role] || ROLE_ENDPOINT.equipment_owner;

  function fetchListings() {
    setLoading(true);
    api
      .get(cfg.endpoint, { params: { [cfg.ownerParam]: user._id } })
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user) fetchListings();
  }, [user]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this listing permanently?')) return;
    try {
      await api.delete(`${cfg.endpoint}/${id}`);
      toast.success('Listing deleted.');
      fetchListings();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete listing.'));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900">
            My Service Listings
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Create, edit, and manage availability for your agricultural listings.
          </p>
        </div>
        <Link
          to="/provider/listings/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold w-fit"
        >
          <PlusCircle className="w-4 h-4" /> Add New Listing
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading your listings...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-200 p-10 text-center space-y-3">
          <p className="font-semibold text-slate-800">You have no listings yet.</p>
          <Link
            to="/provider/listings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 text-white text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4" /> Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item) => {
            const title = item.name || item.title || `${item.category} Team`;
            const priceText =
              cfg.type === 'labour'
                ? `${formatCurrency(item.pricePerWorker)} / worker / ${item.priceUnit}`
                : cfg.type === 'facility'
                  ? `${formatCurrency(item.price)} ${item.priceUnit}`
                  : `${formatCurrency(item.price)} / ${item.priceUnit}`;

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
                      {item.category}
                    </span>
                    <AvailabilityBadge available={item.availability} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[item.location?.village, item.location?.district]
                      .filter(Boolean)
                      .join(', ') || 'No location set'}
                  </div>
                </div>

                <div className="pt-3 border-t border-earth-200 flex items-center justify-between gap-2">
                  <div className="font-bold text-sm text-forest-900">{priceText}</div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/provider/listings/${cfg.type}/${item._id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-forest-50 text-forest-800 hover:bg-forest-100 text-xs font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
