import { useEffect, useMemo, useState } from 'react';
import { ordersApi, tablesApi } from '../api/resources';
import { apiError, formatMAD, isActiveOrder } from '../utils';
import Badge from '../components/Badge';
import OrderPanel from '../components/OrderPanel';
import Modal from '../components/Modal';
import {
  Card,
  DangerButton,
  EmptyState,
  ErrorAlert,
  Field,
  GhostButton,
  NumberInput,
  PageHeader,
  PrimaryButton,
  SelectInput,
  Spinner,
  TextInput,
} from '../components/Form';

const TABLE_STATUSES = ['free', 'occupied', 'reserved'];

const CARD_STYLES = {
  free: 'border-emerald-500/40 bg-emerald-500/[0.07] hover:border-emerald-500/70',
  occupied: 'border-amber-500/40 bg-amber-500/[0.07] hover:border-amber-500/70',
  reserved: 'border-sky-500/40 bg-sky-500/[0.07] hover:border-sky-500/70',
};

const DOT_STYLES = {
  free: 'bg-emerald-400',
  occupied: 'bg-amber-400',
  reserved: 'bg-sky-400',
};

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [t, o] = await Promise.all([tablesApi.list(), ordersApi.list().catch(() => [])]);
      setTables(t);
      setOrders(o);
    } catch (err) {
      setError(apiError(err, 'Could not load tables.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const activeOrderByTable = useMemo(() => {
    const map = {};
    for (const o of orders) {
      if (isActiveOrder(o) && !(o.table_id in map)) map[o.table_id] = o;
    }
    return map;
  }, [orders]);

  const selected = tables.find((t) => t.id === selectedId) || null;

  const setStatus = async (table, status) => {
    setBusy(true);
    try {
      const updated = await tablesApi.update(table.id, { status });
      setTables((ts) => ts.map((t) => (t.id === table.id ? updated : t)));
    } catch (err) {
      setError(apiError(err, 'Could not update table status.'));
    } finally {
      setBusy(false);
    }
  };

  const openOrder = async (table) => {
    setBusy(true);
    setError('');
    try {
      const order = await ordersApi.create(table.id);
      const updated = await tablesApi.update(table.id, { status: 'occupied' });
      setTables((ts) => ts.map((t) => (t.id === table.id ? updated : t)));
      setOrders((os) => [order, ...os]);
    } catch (err) {
      setError(apiError(err, 'Could not open an order.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading floor…" />;

  return (
    <div>
      <PageHeader
        title="Floor plan"
        subtitle="Tap a table to see its order or open a new one."
        actions={<PrimaryButton onClick={() => { setEditing(null); setShowForm(true); }}>+ Add table</PrimaryButton>}
      />
      <ErrorAlert message={error} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Floor grid */}
        <div>
          {tables.length === 0 ? (
            <EmptyState
              title="No tables yet"
              hint="Add your first table to start seating guests."
              action={<PrimaryButton onClick={() => { setEditing(null); setShowForm(true); }}>+ Add table</PrimaryButton>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {tables.map((t) => {
                const active = activeOrderByTable[t.id];
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      CARD_STYLES[t.status] || CARD_STYLES.free
                    } ${selectedId === t.id ? 'ring-2 ring-gold-400' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl font-semibold text-stone-50">
                        {t.number}
                      </span>
                      <span className={`h-3 w-3 rounded-full ${DOT_STYLES[t.status] || DOT_STYLES.free}`} />
                    </div>
                    <p className="mt-1 text-xs text-stone-400">{t.seats} seats</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge status={t.status} />
                    </div>
                    {active && (
                      <p className="mt-1.5 text-xs font-medium text-stone-400">
                        Order #{active.id} · {formatMAD(active.total)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside>
          {!selected ? (
            <Card className="p-6">
              <p className="text-sm text-stone-400">
                Select a table on the floor to manage it — view its active order, change its status,
                or open a new order.
              </p>
            </Card>
          ) : (
            <TablePanel
              key={selected.id}
              table={selected}
              activeOrder={activeOrderByTable[selected.id] || null}
              busy={busy}
              onSetStatus={setStatus}
              onOpenOrder={openOrder}
              onEdit={() => { setEditing(selected); setShowForm(true); }}
              onDelete={() => setShowDelete(selected)}
              onOrderChanged={async () => {
                const [t, o] = await Promise.all([
                  tablesApi.list().catch(() => []),
                  ordersApi.list().catch(() => []),
                ]);
                setTables(t);
                setOrders(o);
              }}
            />
          )}
        </aside>
      </div>

      {showForm && (
        <TableForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={(saved) => {
            setTables((ts) =>
              editing ? ts.map((t) => (t.id === saved.id ? saved : t)) : [...ts, saved],
            );
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {showDelete && (
        <Modal title="Delete table" onClose={() => setShowDelete(null)}>
          <p className="text-sm text-stone-300">
            Delete table <span className="font-bold text-stone-100">{showDelete.number}</span>? This
            cannot be undone.
          </p>
          <div className="mt-5 flex gap-2">
            <DangerButton
              className="flex-1"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await tablesApi.remove(showDelete.id);
                  setTables((ts) => ts.filter((t) => t.id !== showDelete.id));
                  if (selectedId === showDelete.id) setSelectedId(null);
                  setShowDelete(null);
                } catch (err) {
                  setError(apiError(err, 'Could not delete table.'));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete
            </DangerButton>
            <GhostButton onClick={() => setShowDelete(null)}>Keep</GhostButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TablePanel({ table, activeOrder, busy, onSetStatus, onOpenOrder, onEdit, onDelete, onOrderChanged }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500">Table</p>
          <p className="font-display text-3xl font-semibold text-stone-50">{table.number}</p>
          <p className="mt-0.5 text-sm text-stone-400">{table.seats} seats</p>
        </div>
        <Badge status={table.status} />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Set status
        </p>
        <div className="flex gap-2">
          {TABLE_STATUSES.map((s) => (
            <button
              key={s}
              disabled={busy || table.status === s}
              onClick={() => onSetStatus(table, s)}
              className={`flex-1 rounded-xl border px-2 py-2 text-xs font-semibold capitalize transition disabled:opacity-40 ${
                table.status === s
                  ? 'border-gold-500/50 bg-gold-400/15 text-gold-300'
                  : 'border-ember-600 bg-ember-850 text-stone-400 hover:text-stone-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="my-4 border-t border-ember-700" />

      {activeOrder ? (
        <OrderPanel orderId={activeOrder.id} onChanged={onOrderChanged} />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-stone-400">No active order on this table.</p>
          <PrimaryButton className="w-full" disabled={busy} onClick={() => onOpenOrder(table)}>
            Open new order
          </PrimaryButton>
        </div>
      )}

      <div className="my-4 border-t border-ember-700" />

      <div className="flex gap-2">
        <GhostButton className="flex-1 py-2! text-xs!" onClick={onEdit}>
          Edit table
        </GhostButton>
        <DangerButton className="flex-1 py-2! text-xs!" onClick={onDelete}>
          Delete
        </DangerButton>
      </div>
    </Card>
  );
}

function TableForm({ initial, onClose, onSaved }) {
  const [number, setNumber] = useState(initial?.number ?? '');
  const [seats, setSeats] = useState(initial?.seats ?? 4);
  const [status, setStatus] = useState(initial?.status ?? 'free');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { number: String(number), seats: Number(seats), status };
      const saved = initial
        ? await tablesApi.update(initial.id, payload)
        : await tablesApi.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiError(err, 'Could not save table.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? `Edit table ${initial.number}` : 'Add table'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorAlert message={error} />
        <Field label="Table number">
          <TextInput required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="T1" />
        </Field>
        <Field label="Seats">
          <NumberInput required min={1} value={seats} onChange={(e) => setSeats(e.target.value)} />
        </Field>
        <Field label="Status">
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
            {TABLE_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="flex gap-2">
          <PrimaryButton type="submit" className="flex-1" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Add table'}
          </PrimaryButton>
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
        </div>
      </form>
    </Modal>
  );
}
