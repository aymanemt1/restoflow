import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, ordersApi, reservationsApi, tablesApi } from '../api/resources';
import { apiError, formatMAD, isActiveOrder, todayISO } from '../utils';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import { Card, EmptyState, ErrorAlert, PageHeader, PrimaryButton, Spinner } from '../components/Form';

const ICONS = {
  revenue: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  orders: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z" />
      <path d="M4 6h16M9 10a3 3 0 0 0 6 0" />
    </svg>
  ),
  tables: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  ),
  reservations: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, o, r, t] = await Promise.all([
        dashboardApi.summary().catch(() => null),
        ordersApi.list().catch(() => []),
        reservationsApi.list().catch(() => []),
        tablesApi.list().catch(() => []),
      ]);
      setSummary(s);
      setOrders(o);
      setReservations(r);
      setTables(t);
    } catch (err) {
      setError(apiError(err, 'Could not load the dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const tableById = useMemo(() => Object.fromEntries(tables.map((t) => [t.id, t])), [tables]);
  const activeOrders = useMemo(() => orders.filter(isActiveOrder), [orders]);
  const todayRes = useMemo(() => {
    const today = todayISO();
    return reservations
      .filter((r) => r.date === today && !['cancelled', 'no_show'].includes(r.status))
      .sort((a, b) => String(a.time).localeCompare(String(b.time)));
  }, [reservations]);

  if (loading) return <Spinner label="Loading dashboard…" />;

  return (
    <div>
      <PageHeader
        title="Service dashboard"
        subtitle="Live view of the floor, orders and reservations."
        actions={<PrimaryButton onClick={fetchAll}>Refresh</PrimaryButton>}
      />
      <ErrorAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={formatMAD(summary?.today_revenue ?? 0)}
          sub="Paid orders"
          icon={ICONS.revenue}
          accent="gold"
        />
        <StatCard
          label="Active orders"
          value={summary?.active_orders_count ?? activeOrders.length}
          sub="Pending → served"
          icon={ICONS.orders}
          accent="amber"
        />
        <StatCard
          label="Occupied tables"
          value={summary?.occupied_tables_count ?? 0}
          sub={`${tables.length} tables total`}
          icon={ICONS.tables}
          accent="emerald"
        />
        <StatCard
          label="Reservations today"
          value={summary?.today_reservations_count ?? todayRes.length}
          sub="Booked for today"
          icon={ICONS.reservations}
          accent="sky"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-stone-50">Active orders</h2>
            <Link to="/orders" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
              View all →
            </Link>
          </div>
          {activeOrders.length === 0 ? (
            <EmptyState
              title="No active orders"
              hint="The floor is quiet — open a new order from the Tables view."
              action={
                <Link to="/tables">
                  <PrimaryButton>Go to tables</PrimaryButton>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-ember-700">
              {activeOrders.slice(0, 8).map((o) => (
                <li key={o.id}>
                  <Link to={`/orders?open=${o.id}`} className="flex items-center justify-between gap-3 py-3 transition hover:bg-ember-850 rounded-lg px-2 -mx-2">
                    <div>
                      <p className="text-sm font-semibold text-stone-100">
                        Order #{o.id}
                        {tableById[o.table_id] && (
                          <span className="text-stone-400"> · Table {tableById[o.table_id].number}</span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500">
                        {(o.items?.length ?? 0)} item(s) · {formatMAD(o.total)}
                      </p>
                    </div>
                    <Badge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-stone-50">Today's reservations</h2>
            <Link to="/reservations" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
              Manage →
            </Link>
          </div>
          {todayRes.length === 0 ? (
            <EmptyState
              title="No reservations today"
              hint="Walk-ins only, or add a booking from the Reservations view."
              action={
                <Link to="/reservations">
                  <PrimaryButton>New reservation</PrimaryButton>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-ember-700">
              {todayRes.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-100">
                      {r.customer_name}
                      <span className="text-stone-400"> · {r.party_size} guests</span>
                    </p>
                    <p className="text-xs text-stone-500">
                      {r.time?.slice(0, 5)}
                      {r.phone ? ` · ${r.phone}` : ''}
                      {tableById[r.table_id] ? ` · Table ${tableById[r.table_id].number}` : ''}
                    </p>
                  </div>
                  <Badge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
