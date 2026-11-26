import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatNotificationRow,
  mapSupabaseError,
  parsePagination,
} from '../services/supabaseMappers.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const supabase = getSupabaseClient();
  const { from, to } = parsePagination(req.query, 30, 100);

  const [listResult, unreadResult] = await Promise.all([
    supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false),
  ]);

  if (listResult.error) throw mapSupabaseError(listResult.error, 'Could not load notifications.');
  if (unreadResult.error) throw mapSupabaseError(unreadResult.error, 'Could not count unread notifications.');

  res.json({
    success: true,
    unreadCount: unreadResult.count ?? 0,
    total: listResult.count ?? 0,
    data: (listResult.data || []).map(formatNotificationRow),
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'notification id');
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('notifications')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to look up notification.');
  if (!existing) throw new AppError('Notification not found.', 404);
  if (String(existing.user_id) !== String(req.user.id)) {
    throw new AppError('You cannot modify another user notification.', 403);
  }

  const { data: updated, error: updErr } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('*')
    .single();

  if (updErr) throw mapSupabaseError(updErr, 'Could not mark notification as read.');

  res.json({
    success: true,
    data: formatNotificationRow(updated),
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);

  if (error) throw mapSupabaseError(error, 'Could not mark notifications as read.');

  res.json({
    success: true,
    message: 'All notifications marked as read.',
  });
});
