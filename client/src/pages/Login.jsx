import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../utils';
import { ErrorAlert, Field, GhostButton, PrimaryButton, TextInput } from '../components/Form';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const fill = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Login failed. Check your credentials.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ember-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400 font-display text-3xl font-bold text-ember-950">
            R
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-stone-50">
            Resto<span className="text-gold-400">Flow</span>
          </h1>
          <p className="mt-1 text-sm text-stone-400">Sign in to run your restaurant</p>
        </div>

        <div className="rounded-3xl border border-ember-700 bg-ember-900 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <form onSubmit={submit} className="space-y-4">
            <ErrorAlert message={error} />
            <Field label="Email">
              <TextInput
                type="email"
                required
                autoComplete="email"
                placeholder="you@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <PrimaryButton type="submit" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </PrimaryButton>
          </form>

          <div className="mt-6 rounded-xl border border-ember-700 bg-ember-850 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Demo accounts
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <GhostButton
                type="button"
                className="px-3! py-1.5! text-xs!"
                onClick={() => fill('admin@resto.test', 'password')}
              >
                Fill admin
              </GhostButton>
              <GhostButton
                type="button"
                className="px-3! py-1.5! text-xs!"
                onClick={() => fill('staff@resto.test', 'password')}
              >
                Fill staff
              </GhostButton>
            </div>
            <p className="mt-2 font-mono text-xs text-stone-500">
              admin@resto.test / staff@resto.test · password: <span className="text-stone-300">password</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
