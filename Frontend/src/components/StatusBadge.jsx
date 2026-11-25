import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  CircleDot,
  Users,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { STATUS_BADGES } from '../utils/constants';

const STATUS_ICONS = {
  Pending: Clock,
  'Applications Received': Users,
  'Worker Accepted': CheckCircle2,
  Accepted: CheckCircle2,
  Rejected: XCircle,
  Cancelled: Ban,
  Completed: Sparkles,
  Open: CircleDot,
  'Partially Filled': Users,
  Filled: CheckCircle2,
  'Fully Filled': CheckCircle2,
  'In Progress': Clock,
};

export function BookingStatusBadge({ status }) {
  const { t } = useTranslation();
  const cls =
    STATUS_BADGES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const Icon = STATUS_ICONS[status] || CircleDot;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{t(`statuses.${status}`, status)}</span>
    </span>
  );
}

export function AvailabilityBadge({ available }) {
  const { t } = useTranslation();
  return available ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
      {t('common.available', 'Available')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <XCircle className="w-3 h-3" aria-hidden="true" />
      {t('common.unavailable', 'Unavailable')}
    </span>
  );
}
