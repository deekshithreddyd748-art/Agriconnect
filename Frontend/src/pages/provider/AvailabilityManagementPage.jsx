import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AvailabilityBadge } from '../../components/StatusBadge';

const ROLE_CFG = {
  equipment_owner: { endpoint: '/equipment', ownerParam: 'ownerId', type: 'equipment' },
  labour_provider: { endpoint: '/labour', ownerParam: 'providerId', type: 'labour' },
  facility_operator: { endpoint: '/facilities', ownerParam: 'operatorId', type: 'facility' },
};

export default function AvailabilityManagementPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const cfg = ROLE_CFG[user?.role] || ROLE_CFG.equipment_owner;

  function fetchItems() {
    setLoading(true);
    api
      .get(cfg.endpoint, { params: { [cfg.ownerParam]: user._id } })
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  async function toggleAvailability(item) {
    try {
      await api.put(`${cfg.endpoint}/${item._id}`, {
        availability: !item.availability,
      });
      toast.success(t('common.saveSuccess'));
      fetchItems();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-forest-900">
          {t('provider.availabilityTitle')}
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">{t('provider.subtitle')}</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-200 p-8 text-center text-sm text-slate-500">
          {t('provider.noListings')}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-earth-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <div className="text-xs font-bold uppercase text-fresh-600">
                  {t(`categories.${cfg.type}.${item.category}`, item.category)}
                </div>
                <div className="text-base font-bold text-slate-900">
                  {item.name ||
                    item.title ||
                    t(`categories.${cfg.type}.${item.category}`, item.category)}
                </div>
                {cfg.type === 'facility' && (
                  <div className="text-xs text-slate-500">
                    {t('marketplace.capacityLabel')}: {item.availableCapacity} /{' '}
                    {item.capacity} {item.capacityUnit}
                  </div>
                )}
                {cfg.type === 'labour' && (
                  <div className="text-xs text-slate-500">
                    {t('marketplace.workersAvailable', { count: item.workersAvailable })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <AvailabilityBadge available={item.availability} />
                <button
                  type="button"
                  onClick={() => toggleAvailability(item)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    item.availability
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-forest-700 text-white hover:bg-forest-800'
                  }`}
                >
                  {item.availability ? (
                    <>
                      <ToggleRight className="w-4 h-4" /> {t('provider.toggleUnavailable')}
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" /> {t('provider.toggleAvailable')}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
