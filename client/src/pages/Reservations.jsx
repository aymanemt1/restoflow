import { useEffect, useMemo, useState } from 'react';
import { reservationsApi, tablesApi } from '../api/resources';
import { apiError, todayISO } from '../utils';
import Modal from '../components/Modal';
import {
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

const RES_STATUSES = ['pending', 'confirmed', 'seated', 'cancelled', 'no_show'];

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dateFilter, setDateFilter] = useState(todayISO());
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [r, t] = await Promise.all([
        reservationsApi.list(),
        tablesApi.list().catch(() => []),
      ]);
      setReservations(r);
      setTables(t);
    } catch (err) {
      setError(apiError(err, 'Could not load reservations.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const tableById = useMemo(() => Object.fromEntries(tables.map((t) => [t.id, t])), [tables]);

  const visible = useMemo(() => {
    return reservations
      .filter((r) => {
        if (dateFilter && r.date !== dateFilter) return false;
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => String(a.time).localeCompare(String(b.time)));
  }, [reservations, dateFilter, statusFilter]);

  const quickStatus = async (r, status) => {
    setBusy(true);
    try {
      const saved = await reservationsApi.update(r.id, { status });
      setReservations((rs) => rs.map((x) => (x.id === r.id ? saved : x)));
    } catch (err) {
      setError(apiError(err, 'Could not update reservation.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading reservations…" />;

  return (
    <div>
      <PageHeader
        title="Reservations"
        subtitle="Bookings by date — confirm, seat, or reassign tables."
        actions={<PrimaryButton onClick={() => { setEditing(null); setShowForm(true); }}>+ New reservation</PrimaryButton>}
      />
      <ErrorAlert message={error} />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-48">
          <TextInput type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <SelectInput
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        >
          <option value="all">All statuses</option>
          {RES_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s.replace('_', ' ')}
            </option>
          ))}
        </SelectInput>
        {(dateFilter || statusFilter !== 'all') && (
          <GhostButton
            onClick={() => { setDateFilter(''); setStatusFilter('all'); }}
            className="py-2!"
          >
            Clear filters
          </GhostButton>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No reservations found"
          hint="Adjust the date filter or create a new booking."
          action={<PrimaryButton onClick={() => { setEditing(null); setShowForm(true); }}>+ New reservation</PrimaryButton>}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ember-700 bg-ember-900">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-ember-700 text-xs uppercase tracking-wider text-stone-500">
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Date · Time</th>
                <th className="px-4 py-3 font-semibold">Party</th>
                <th className="px-4 py-3 font-semibold">Table</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ember-700/70">
              {visible.map((r) => (
                <tr key={r.id} className="transition hover:bg-ember-850">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-stone-100">{r.customer_name}</p>
                    <p className="text-xs text-stone-500">{r.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-300">
                    {r.date} · {String(r.time || '').slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-stone-300">{r.party_size}</td>
                  <td className="px-4 py-3 text-stone-300">
                    {tableById[r.table_id] ? `Table ${tableById[r.table_id].number}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <SelectInput
                      value={r.status}
                      disabled={busy}
                      onChange={(e) => quickStatus(r, e.target.value)}
                      className="w-auto! py-1.5! px-2.5! text-xs! rounded-lg!"
                    >
                      {RES_STATUSES.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </SelectInput>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setEditing(r); setShowForm(true); }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-400 hover:bg-ember-700 hover:text-stone-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(r)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-red-500/10 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ReservationForm
          initial={editing}
          tables={tables}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={(saved) => {
            setReservations((rs) =>
              editing ? rs.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...rs],
            );
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <Modal title="Delete reservation" onClose={() => setDeleting(null)}>
          <p className="text-sm text-stone-300">
            Delete the reservation for{' '}
            <span className="font-bold text-stone-100">{deleting.customer_name}</span> on{' '}
            {deleting.date}? This cannot be undone.
          </p>
          <div className="mt-5 flex gap-2">
            <DangerButton
              className="flex-1"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await reservationsApi.remove(deleting.id);
                  setReservations((rs) => rs.filter((x) => x.id !== deleting.id));
                  setDeleting(null);
                } catch (err) {
                  setError(apiError(err, 'Could not delete reservation.'));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete
            </DangerButton>
            <GhostButton onClick={() => setDeleting(null)}>Keep</GhostButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReservationForm({ initial, tables, onClose, onSaved }) {
  const [customerName, setCustomerName] = useState(initial?.customer_name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [time, setTime] = useState(String(initial?.time || '19:00').slice(0, 5));
  const [partySize, setPartySize] = useState(initial?.party_size ?? 2);
  const [tableId, setTableId] = useState(initial?.table_id ? String(initial.table_id) : '');
  const [status, setStatus] = useState(initial?.status ?? 'pending');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        customer_name: customerName,
        phone: phone || null,
        date,
        time: time.length === 5 ? `${time}:00` : time,
        party_size: Number(partySize),
        table_id: tableId ? Number(tableId) : null,
        status,
      };
      const saved = initial
        ? await reservationsApi.update(initial.id, payload)
        : await reservationsApi.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiError(err, 'Could not save reservation.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit reservation' : 'New reservation'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorAlert message={error} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Guest name">
            <TextInput required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Salma B." />
          </Field>
          <Field label="Phone">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 6 00 00 00 00" />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Date">
            <TextInput type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <TextInput type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Party size">
            <NumberInput required min={1} value={partySize} onChange={(e) => setPartySize(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Table (optional)">
            <SelectInput value={tableId} onChange={(e) => setTableId(e.target.value)}>
              <option value="">Assign later</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.number} · {t.seats} seats · {t.status}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
              {RES_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.replace('_', ' ')}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div className="flex gap-2">
          <PrimaryButton type="submit" className="flex-1" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Create reservation'}
          </PrimaryButton>
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
        </div>
      </form>
    </Modal>
  );
}
