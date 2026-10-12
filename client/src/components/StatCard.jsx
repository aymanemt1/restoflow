export default function StatCard({ label, value, sub, icon, accent = 'gold' }) {
  const accents = {
    gold: 'bg-gold-400/15 text-gold-300',
    emerald: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-300',
    sky: 'bg-sky-500/15 text-sky-300',
    violet: 'bg-violet-500/15 text-violet-300',
  };
  return (
    <div className="rounded-2xl border border-ember-700 bg-ember-900 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accents[accent] || accents.gold}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}
