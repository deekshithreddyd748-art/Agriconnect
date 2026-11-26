import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatReviewRow,
  mapSupabaseError,
  parsePagination,
} from '../services/supabaseMappers.js';

const REVIEW_SELECT =
  '*, reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, village, district, role)';

export const getReviews = asyncHandler(async (req, res) => {
  const { reviewedUserId, bookingId } = req.query;
  const supabase = getSupabaseClient();
  const { from, to } = parsePagination(req.query, 20, 50);

  let query = supabase
    .from('reviews')
    .select(REVIEW_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (reviewedUserId) {
    assertValidUuid(reviewedUserId, 'reviewedUserId');
    query = query.eq('reviewed_user_id', reviewedUserId);
  }
  if (bookingId) {
    assertValidUuid(bookingId, 'bookingId');
    query = query.eq('booking_id', bookingId);
  }

  const { data: rows, count, error } = await query;
  if (error) throw mapSupabaseError(error, 'Failed to load reviews.');

  const formatted = (rows || []).map(formatReviewRow);
  const totalReviews = count ?? formatted.length;
  const averageRating =
    formatted.length > 0
      ? Math.round(
          (formatted.reduce((sum, r) => sum + r.rating, 0) / formatted.length) * 10
        ) / 10
      : 0;

  res.json({
    success: true,
    averageRating,
    totalReviews,
    data: formatted,
  });
});

export const createReview = asyncHandler(async (req, res) => {
  const bookingId = assertValidUuid(req.body?.booking_id ?? req.body?.bookingId, 'booking id');
  const rating = Number(req.body?.rating);
  const reviewText = String(req.body?.review_text ?? req.body?.reviewText ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError('Rating must be a whole number between 1 and 5.', 400, 'INVALID_RATING');
  }
  if (reviewText.length > 1000) {
    throw new AppError('Review text cannot exceed 1000 characters.', 400);
  }

  const supabase = getSupabaseClient();
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, farmer_id, provider_id, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to verify booking.');
  if (!booking) throw new AppError('Booking not found.', 404);

  const isFarmer = String(booking.farmer_id) === String(req.user.id);
  const isProvider = String(booking.provider_id) === String(req.user.id);
  if (!isFarmer && !isProvider) {
    throw new AppError('Only booking participants can submit a review.', 403);
  }
  if (booking.status !== 'Completed') {
    throw new AppError('Only completed bookings can be reviewed.', 400, 'BOOKING_NOT_COMPLETED');
  }

  const reviewedUserId = isFarmer ? booking.provider_id : booking.farmer_id;

  const { data: created, error: insertErr } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: req.user.id,
      reviewed_user_id: reviewedUserId,
      booking_id: bookingId,
      rating,
      review_text: reviewText,
    })
    .select(REVIEW_SELECT)
    .single();

  if (insertErr) {
    if (insertErr.code === '23505') {
      throw new AppError(
        'You have already submitted a review for this booking.',
        409,
        'DUPLICATE_REVIEW'
      );
    }
    throw mapSupabaseError(insertErr, 'Could not submit review.');
  }

  res.status(201).json({
    success: true,
    data: formatReviewRow(created),
  });
});
