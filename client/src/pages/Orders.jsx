import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ordersApi, tablesApi } from '../api/resources';
import { apiError, formatMAD, isActiveOrder, ORDER_FLOW } from '../utils';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import OrderPanel from '../components/OrderPanel';
import {
  EmptyState,
  ErrorAlert,
  Field,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SelectInput,
  Spinner,
} from '../components/Form';

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All' },
  { id: 'history', label: 'History' },
];

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('active');
  const [openId, setOpenId] = useState(() => {
    const q = Number(searchParams.get('open'));
    return q || null;
  });
  const [showNew, setShowNew] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [o, t] = await Promise.all([ordersApi.list(), tablesApi.list().catch(() => [])]);
      setOrders(o);
      setTables(t);
    } catch (err) {
      setError(apiError(err, 'Could not load orders.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const q = Number(searchParams.get('open'));
    if (q) {
      setOpenId(q);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const tableById = useMemo(() => Object.fromEntries(tables.map((t) => [t.id, t])), [tables]);

  const visible = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.id - a.id);
    if (tab === 'active') return sorted.filter(isActiveOrder);
    if (tab === 'history') return sorted.filter((o) => !isActiveOrder(o));
    return sorted;
  }, [orders, tab]);

  if (loading) return <Spinner label="Loading orders…" />;

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="The point-of-sale queue — open an order to add items and take payment."
        actions={<PrimaryButton onClick={() => setShowNew(true)}>+ New order</PrimaryButton>}
      />
      <ErrorAlert message={error} />

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-gold-400/15 text-gold-300 border border-gold-500/40'
                : 'border border-ember-600 bg-ember-900 text-stone-400 hover:text-stone-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={tab === 'active' ? 'No active orders' : 'No orders found'}
          hint="Open a new order from a free table to get the service started."
          action={<PrimaryButton onClick={() => setShowNew(true)}>+ New order</PrimaryButton>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((o) => (
            <button
              key={o.id}
              onClick={() => setOpenId(o.id)}
              className="rounded-2xl border border-ember-700 bg-ember-900 p-4 text-left transition hover:border-ember-500"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-lg font-semibold text-stone-50">Order #{o.id}</p>
                <Badge status={o.status} />
              </div>
              <p className="mt-1 text-sm text-stone-400">
                {tableById[o.table_id] ? `Table ${tableById[o.table_id].number}` : 'No table'}
                {' · '}
                {(o.items?.length ?? 0)} item(s)
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gold-300">{formatMAD(o.total)}</span>
                <span className="text-xs font-semibold text-stone-500">
                  {ORDER_FLOW.indexOf(o.status) >= 0
                    ? `Step ${ORDER_FLOW.indexOf(o.status) + 1}/${ORDER_FLOW.length}`
                    : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {openId && (
        <Modal title={`Order #${openId}`} wide onClose={() => setOpenId(null)}>
          <OrderPanel orderId={openId} onChanged={fetchAll} />
        </Modal>
      )}

      {showNew && (
        <NewOrderModal
          tables={tables}
          onClose={() => setShowNew(false)}
          onCreated={(order) => {
            setShowNew(false);
            fetchAll();
            setOpenId(order.id);
          }}
        />
      )}
    </div>
  );
}

function NewOrderModal({ tables, onClose, onCreated }) {
  const [tableId, setTableId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const freeTables = tables.filter((t) => t.status === 'free');

  const submit = async (e) => {
    e.preventDefault();
    if (!tableId) return;
    setBusy(true);
    setError('');
    try {
      const order = await ordersApi.create(Number(tableId));
      try {
        await tablesApi.update(Number(tableId), { status: 'occupied' });
      } catch {
        /* table status is best-effort */
      }
      onCreated(order);
    } catch (err) {
      setError(apiError(err, 'Could not create order.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New order" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorAlert message={error} />
        <Field label="Table">
          <SelectInput value={tableId} onChange={(e) => setTableId(e.target.value)} required>
            <option value="">Select a free table…</option>
            {freeTables.map((t) => (
              <option key={t.id} value={t.id}>
                Table {t.number} · {t.seats} seats
              </option>
            ))}
          </SelectInput>
        </Field>
        {freeTables.length === 0 && (
          <p className="text-xs text-stone-500">
            No free tables right now — free one up from the Tables view.
          </p>
        )}
        <div className="flex gap-2">
          <PrimaryButton type="submit" className="flex-1" disabled={busy || !tableId}>
            {busy ? 'Creating…' : 'Create order'}
          </PrimaryButton>
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
        </div>
      </form>
    </Modal>
  );
}
