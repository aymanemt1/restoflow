import { humanize } from '../utils';

const STYLES = {
  // order statuses
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  preparing: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  served: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
  // table statuses
  free: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  occupied: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  reserved: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  // reservation statuses
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  seated: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  no_show: 'bg-stone-500/15 text-stone-300 border-stone-500/30',
  // user roles
  admin: 'bg-gold-500/15 text-gold-300 border-gold-500/40',
  staff: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

export default function Badge({ status, className = '' }) {
  const key = String(status ?? '');
  const style = STYLES[key] || 'bg-stone-500/15 text-stone-300 border-stone-500/30';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${style} ${className}`}
    >
      {humanize(key)}
    </span>
  );
}
