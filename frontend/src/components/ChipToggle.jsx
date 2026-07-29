import { Check } from 'lucide-react';

/** A single toggle-able pill — matches VaultInput's border/glow language. Used for the
 * multi-select streaming/social/gaming/work service groups during vault setup. */
function ChipToggle({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all duration-200 ${
        selected
          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.15)]'
          : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500'
      }`}
    >
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
      {label}
    </button>
  );
}

export default ChipToggle;
