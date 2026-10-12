export const inputClass =
  'w-full rounded-xl bg-ember-950 border border-ember-700 px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 transition';

export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} className={`${inputClass} ${props.className || ''}`} />;
}

export function NumberInput(props) {
  return <input type="number" {...props} className={`${inputClass} ${props.className || ''}`} />;
}

export function SelectInput({ children, ...props }) {
  return (
    <select {...props} className={`${inputClass} ${props.className || ''}`}>
      {children}
    </select>
  );
}

export function TextArea(props) {
  return <textarea rows={3} {...props} className={`${inputClass} ${props.className || ''}`} />;
}

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-ember-950 transition hover:bg-gold-300 disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-ember-600 bg-ember-800 px-4 py-2.5 text-sm font-semibold text-stone-200 transition hover:border-ember-500 hover:bg-ember-700 disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 group"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? 'bg-gold-400' : 'bg-ember-600'
        }`}
      >
        <span
          className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
          }`}
        />
      </span>
      {label && (
        <span className="text-sm font-medium text-stone-300 group-hover:text-stone-100">{label}</span>
      )}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-ember-700 bg-ember-900 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold text-stone-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ember-600 bg-ember-900/50 px-6 py-12 text-center">
      <p className="font-display text-lg text-stone-200">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-stone-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-stone-400">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-ember-600 border-t-gold-400" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  );
}
