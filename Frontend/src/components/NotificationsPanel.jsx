import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api, { getErrorMessage } from '../services/api';
import { formatDate } from '../utils/distance';

export default function NotificationsPanel({
  notifications = [],
  unreadCount = 0,
  onRefresh,
}) {
  const { t, i18n } = useTranslation();

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorGeneric')));
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-forest-700" />
          {t('dashboard.notifications')}
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-forest-700 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </h2>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:underline"
          >
            <CheckCheck className="w-4 h-4" />
            {t('notifications.markAllRead', 'Mark all read')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          {t('dashboard.noAlerts')}
        </p>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-3.5 text-sm flex items-start justify-between gap-3 ${
                n.is_read
                  ? 'border-earth-200 bg-white text-slate-700'
                  : 'border-forest-200 bg-forest-50/70 text-slate-900'
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-bold text-xs sm:text-sm">{n.title}</div>
                <p className="text-xs text-slate-600">{n.message}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                  <span>{formatDate(n.created_at, i18n.language)}</span>
                  {n.related_booking_id && (
                    <Link
                      to={`/bookings/${n.related_booking_id}`}
                      className="text-forest-700 font-semibold hover:underline"
                    >
                      {t('bookings.viewDetails')}
                    </Link>
                  )}
                </div>
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-forest-200 text-forest-800 text-[11px] font-bold hover:bg-forest-100"
                >
                  {t('notifications.markRead', 'Read')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
