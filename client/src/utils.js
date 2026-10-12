export const formatMAD = (n) => {
  const v = Number(n ?? 0);
  return `${v.toFixed(2)} MAD`;
};

export const todayISO = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const humanize = (s) =>
  String(s ?? '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const apiError = (err, fallback = 'Something went wrong.') => {
  const data = err?.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  return data?.message || err?.message || fallback;
};

export const ORDER_FLOW = ['pending', 'preparing', 'served', 'paid'];
export const ACTIVE_ORDER_STATUSES = ['pending', 'preparing', 'served'];
export const isActiveOrder = (o) => ACTIVE_ORDER_STATUSES.includes(o?.status);
