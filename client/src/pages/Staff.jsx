import { useEffect, useState } from 'react';
import { usersApi } from '../api/resources';
import { apiError } from '../utils';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  DangerButton,
  EmptyState,
  ErrorAlert,
  Field,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SelectInput,
  Spinner,
  TextInput,
} from '../components/Form';

export default function Staff() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await usersApi.list());
    } catch (err) {
      setError(
        err?.response?.status === 403
          ? 'Only admins can manage staff.'
          : apiError(err, 'Could not load users.'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) return <Spinner label="Loading staff…" />;

  return (
    <div>
      <PageHeader
        title="Staff management"
        subtitle="Admin only — who can sign in, and with which role."
        actions={<PrimaryButton onClick={() => { setEditing(null); setShowForm(true); }}>+ Add user</PrimaryButton>}
      />
      <ErrorAlert message={error} />

      {users.length === 0 && !error ? (
        <EmptyState
          title="No users yet"
          hint="Create the first staff account — admins see everything, staff run the floor."
          action={<PrimaryButton onClick={() => { setEditing(null); setShowForm(true); }}>+ Add user</PrimaryButton>}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ember-700 bg-ember-900">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-ember-700 text-xs uppercase tracking-wider text-stone-500">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ember-700/70">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-ember-850">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ember-600 text-sm font-bold text-gold-200">
                        {(u.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="font-semibold text-stone-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge status={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setEditing(u); setShowForm(true); }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-400 hover:bg-ember-700 hover:text-stone-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(u)}
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
        <UserForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={(saved) => {
            setUsers((us) =>
              editing ? us.map((x) => (x.id === saved.id ? saved : x)) : [...us, saved],
            );
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <Modal title="Delete user" onClose={() => setDeleting(null)}>
          <p className="text-sm text-stone-300">
            Remove <span className="font-bold text-stone-100">{deleting.name}</span> (
            {deleting.email})? They will no longer be able to sign in.
          </p>
          <div className="mt-5 flex gap-2">
            <DangerButton
              className="flex-1"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await usersApi.remove(deleting.id);
                  setUsers((us) => us.filter((x) => x.id !== deleting.id));
                  setDeleting(null);
                } catch (err) {
                  setError(apiError(err, 'Could not delete user.'));
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

function UserForm({ initial, onClose, onSaved }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initial?.role ?? 'staff');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { name, email, role };
      if (password) payload.password = password;
      if (!initial && !password) throw new Error('Password is required for a new user.');
      const saved = initial
        ? await usersApi.update(initial.id, payload)
        : await usersApi.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiError(err, 'Could not save user.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? `Edit ${initial.name}` : 'New user'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorAlert message={error} />
        <Field label="Name">
          <TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Yasmine El Fassi" />
        </Field>
        <Field label="Email">
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yasmine@restaurant.com" />
        </Field>
        <Field
          label={initial ? 'New password (leave blank to keep)' : 'Password'}
          hint={!initial ? 'Minimum 8 characters is recommended.' : undefined}
        >
          <TextInput
            type="password"
            autoComplete="new-password"
            required={!initial}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Role">
          <SelectInput value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="staff">Staff — floor, orders, reservations</option>
            <option value="admin">Admin — everything, incl. staff</option>
          </SelectInput>
        </Field>
        <div className="flex gap-2">
          <PrimaryButton type="submit" className="flex-1" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Create user'}
          </PrimaryButton>
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
        </div>
      </form>
    </Modal>
  );
}
