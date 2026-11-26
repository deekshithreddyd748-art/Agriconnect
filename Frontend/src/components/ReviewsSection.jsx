import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api, { getErrorMessage } from '../services/api';
import { formatDate } from '../utils/distance';

export default function ReviewsSection({
  reviewedUserId,
  bookingId = null,
  canSubmitReview = false,
}) {
  const { t, i18n } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function loadReviews() {
    if (!reviewedUserId && !bookingId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get('/reviews', {
        params: {
          ...(reviewedUserId ? { reviewedUserId } : {}),
          ...(bookingId ? { bookingId } : {}),
        },
      })
      .then((res) => {
        setReviews(res.data?.data || []);
        setAverageRating(res.data?.averageRating || 0);
        setTotalReviews(res.data?.totalReviews || 0);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReviews();
  }, [reviewedUserId, bookingId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!bookingId || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        booking_id: bookingId,
        rating,
        review_text: reviewText,
      });
      toast.success(t('reviews.submitted', 'Thank you! Your review has been saved.'));
      setReviewText('');
      loadReviews();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-earth-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          {t('reviews.heading', 'Ratings & Reviews')}
        </h2>
        <div className="text-sm font-semibold text-slate-700">
          {totalReviews > 0
            ? `${averageRating} / 5 (${totalReviews})`
            : t('reviews.noReviewsShort', 'No reviews yet')}
        </div>
      </div>

      {canSubmitReview && bookingId && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-forest-50/70 border border-forest-200 p-4 space-y-3"
        >
          <div className="text-sm font-bold text-forest-900">
            {t('reviews.leaveReviewTitle', 'Rate this completed booking')}
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setRating(num)}
                aria-label={`${num} star`}
                className="p-1.5 rounded-lg hover:bg-white transition-colors"
              >
                <Star
                  className={`w-6 h-6 ${
                    num <= rating
                      ? 'text-amber-500 fill-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            maxLength={1000}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={t('reviews.placeholder', 'Share feedback on punctuality, condition, or service quality...')}
            className="w-full px-3.5 py-2 rounded-xl border border-earth-200 text-sm bg-white"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 min-h-[42px] rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold disabled:opacity-60"
          >
            {submitting ? t('common.submitting') : t('reviews.submitBtn', 'Submit Review')}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-slate-500">{t('common.loading')}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-500">
          {t('reviews.empty', 'No ratings or reviews have been posted yet.')}
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl border border-earth-200 p-3.5 space-y-1 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">
                  {rev.reviewerId?.name || t('roles.farmer')}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {rev.rating}/5
                </span>
              </div>
              {rev.review_text && (
                <p className="text-slate-700 text-xs sm:text-sm">{rev.review_text}</p>
              )}
              <div className="text-[11px] text-slate-400">
                {formatDate(rev.created_at, i18n.language)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
