import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FavouriteButton({ listingType, listingId, className = '' }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !listingId) {
      setSaved(false);
      return;
    }
    let mounted = true;
    api
      .get('/favourites')
      .then((res) => {
        if (!mounted) return;
        const found = (res.data?.data || []).some(
          (f) =>
            f.listing_type === listingType &&
            String(f.listing_id) === String(listingId)
        );
        setSaved(found);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [user, listingType, listingId]);

  async function toggleFavourite(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) {
      toast.error(t('favourites.loginRequired', 'Please continue with your profile to save listings.'));
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      if (saved) {
        await api.delete(`/favourites/${listingId}`);
        setSaved(false);
        toast.success(t('favourites.removed', 'Removed from saved listings.'));
      } else {
        await api.post('/favourites', {
          listing_type: listingType,
          listing_id: listingId,
        });
        setSaved(true);
        toast.success(t('favourites.saved', 'Saved to your favourites!'));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggleFavourite}
      aria-pressed={saved}
      aria-label={saved ? t('favourites.removeLabel', 'Remove saved listing') : t('favourites.saveLabel', 'Save listing')}
      className={`inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl border text-xs font-semibold transition-colors disabled:opacity-60 ${
        saved
          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
          : 'bg-white border-earth-200 text-slate-700 hover:bg-earth-50'
      } ${className}`}
    >
      <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
      <span>{saved ? t('favourites.savedShort', 'Saved') : t('favourites.saveShort', 'Save')}</span>
    </button>
  );
}
