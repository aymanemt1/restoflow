import { useCallback, useEffect, useMemo, useState } from 'react';
import { categoriesApi, menuItemsApi, ordersApi } from '../api/resources';
import { apiError, formatMAD, humanize, isActiveOrder, ORDER_FLOW } from '../utils';
import Badge from './Badge';
import { DangerButton, ErrorAlert, Field, GhostButton, NumberInput, PrimaryButton, SelectInput, Spinner } from './Form';
import Modal from './Modal';

/**
 * Full point-of-sale panel for one order:
 * line items, add items with quantities, status flow, cancel, pay with total.
 * Used by the Tables side panel and the Orders page drawer.
 */
export default function OrderPanel({ orderId, onChanged }) {
  const [order, setOrder] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [paidTotal, setPaidTotal] = useState(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [o, items, cats] = await Promise.all([
        ordersApi.get(orderId),
        menuItemsApi.list().catch(() => []),
        categoriesApi.list().catch(() => []),
      ]);
      setOrder(o);
      setMenu(items);
      setCategories(cats);
    } catch (err) {
      setError(apiError(err, 'Could not load this order.'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const menuById = useMemo(() => Object.fromEntries(menu.map((m) => [m.id, m])), [menu]);

  const lines = useMemo(() => {
    const items = order?.items ?? [];
    return items.map((it) => {
      const m = it.menu_item || menuById[it.menu_item_id] || {};
      return {
        key: it.id ?? `${it.menu_item_id}-${it.qty}`,
        name: m.name || it.name || 'Item',
        qty: Number(it.qty ?? it.quantity ?? 1),
        unit: Number(it.price ?? it.unit_price ?? m.price ?? 0),
      };
    });
  }, [order, menuById]);

  const total = useMemo(() => {
    if (order?.total != null) return Number(order.total);
    return lines.reduce((s, l) => s + l.qty * l.unit, 0);
  }, [order, lines]);

  const mutate = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      const fresh = await ordersApi.get(orderId);
      setOrder(fresh);
      onChanged?.();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading order…" />;
  if (!order) return <ErrorAlert message={error || 'Order not found.'} />;

  const status = order.status;
  const active = isActiveOrder(order);
  const nextStatus = ORDER_FLOW[ORDER_FLOW.indexOf(status) + 1];
  const NEXT_LABEL = { preparing: 'Start preparing', served: 'Mark served' };

  const doPay = () =>
    mutate(async () => {
      const res = await ordersApi.pay(orderId);
      const t = res?.total ?? total;
      setPaidTotal(t);
      setShowPay(false);
    });

  return (
    <div className="space-y-4">
      <ErrorAlert message={error} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500">Order</p>
          <p className="font-display text-xl font-semibold text-stone-50">#{order.id}</p>
        </div>
        <Badge status={status} />
      </div>

      {paidTotal != null && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
          <p className="text-sm font-semibold text-emerald-300">Payment received</p>
          <p className="font-display text-3xl font-semibold text-emerald-200">{formatMAD(paidTotal)}</p>
        </div>
      )}

      {/* Line items */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Items</p>
        {lines.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ember-600 px-4 py-6 text-center text-sm text-stone-500">
            No items yet — add the first one below.
          </p>
        ) : (
          <ul className="divide-y divide-ember-700 overflow-hidden rounded-xl border border-ember-700 bg-ember-850">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-100">{l.name}</p>
                  <p className="text-xs text-stone-500">
                    {l.qty} × {formatMAD(l.unit)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gold-300">{formatMAD(l.qty * l.unit)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-ember-850 px-4 py-3">
        <span className="text-sm font-semibold text-stone-300">Total</span>
        <span className="font-display text-2xl font-semibold text-gold-300">{formatMAD(total)}</span>
      </div>

      {/* Actions */}
      {active && (
        <div className="space-y-2">
          {!showAdd ? (
            <PrimaryButton className="w-full" onClick={() => setShowAdd(true)} disabled={busy}>
              + Add items
            </PrimaryButton>
          ) : (
            <AddItemsForm
              menu={menu}
              categories={categories}
              busy={busy}
              onCancel={() => setShowAdd(false)}
              onAdd={(menu_item_id, qty) =>
                mutate(async () => {
                  await ordersApi.addItem(orderId, menu_item_id, qty);
                  setShowAdd(false);
                })
              }
            />
          )}

          <div className="flex gap-2">
            {nextStatus && nextStatus !== 'paid' && (
              <PrimaryButton
                className="flex-1"
                disabled={busy}
                onClick={() => mutate(() => ordersApi.setStatus(orderId, nextStatus))}
              >
                {NEXT_LABEL[nextStatus] || humanize(nextStatus)} →
              </PrimaryButton>
            )}
            {nextStatus === 'paid' && (
              <PrimaryButton className="flex-1" disabled={busy} onClick={() => setShowPay(true)}>
                Mark paid · {formatMAD(total)}
              </PrimaryButton>
            )}
            <DangerButton disabled={busy} onClick={() => setShowCancel(true)}>
              Cancel
            </DangerButton>
          </div>
        </div>
      )}

      {/* Pay confirmation */}
      {showPay && (
        <Modal title="Confirm payment" onClose={() => setShowPay(false)}>
          <p className="text-sm text-stone-300">
            Collect <span className="font-bold text-gold-300">{formatMAD(total)}</span> for order #
            {order.id}?
          </p>
          <div className="mt-5 flex gap-2">
            <PrimaryButton className="flex-1" disabled={busy} onClick={doPay}>
              Confirm payment
            </PrimaryButton>
            <GhostButton onClick={() => setShowPay(false)}>Back</GhostButton>
          </div>
        </Modal>
      )}

      {/* Cancel confirmation */}
      {showCancel && (
        <Modal title="Cancel order" onClose={() => setShowCancel(false)}>
          <p className="text-sm text-stone-300">
            Cancel order #{order.id}? This cannot be undone.
          </p>
          <div className="mt-5 flex gap-2">
            <DangerButton
              className="flex-1"
              disabled={busy}
              onClick={() =>
                mutate(async () => {
                  await ordersApi.setStatus(orderId, 'cancelled');
                  setShowCancel(false);
                })
              }
            >
              Yes, cancel order
            </DangerButton>
            <GhostButton onClick={() => setShowCancel(false)}>Keep</GhostButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AddItemsForm({ menu, categories, busy, onCancel, onAdd }) {
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState(1);
  const available = menu.filter((m) => m.available !== false);

  const catName = (id) => categories.find((c) => c.id === id)?.name || 'Other';
  const grouped = useMemo(() => {
    const g = {};
    for (const m of available) {
      const k = catName(m.category_id);
      (g[k] ||= []).push(m);
    }
    return g;
  }, [available, categories]);

  return (
    <div className="space-y-3 rounded-xl border border-ember-600 bg-ember-850 p-4">
      <Field label="Menu item">
        <SelectInput value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">Select an item…</option>
          {Object.entries(grouped).map(([cat, items]) => (
            <optgroup key={cat} label={cat}>
              {items.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {formatMAD(m.price)}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectInput>
      </Field>
      <div className="flex gap-2">
        <Field label="Qty">
          <NumberInput
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-24"
          />
        </Field>
        <div className="flex flex-1 items-end gap-2">
          <PrimaryButton
            className="flex-1"
            disabled={busy || !itemId}
            onClick={() => onAdd(Number(itemId), qty)}
          >
            Add to order
          </PrimaryButton>
          <GhostButton onClick={onCancel}>×</GhostButton>
        </div>
      </div>
      {available.length === 0 && (
        <p className="text-xs text-stone-500">No available menu items — add some in Menu first.</p>
      )}
    </div>
  );
}
