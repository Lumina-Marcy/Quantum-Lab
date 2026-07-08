/** Purple-accented note card reinforcing that visualizations are simplified teaching aids. */
function EducationalCard({ title = "What You're Seeing", children }) {
  return (
    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-slate-900/80 p-6 shadow-lg shadow-purple-500/10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-300">{title}</p>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">{children}</div>
      <p className="mt-4 border-t border-slate-700/60 pt-3 text-[11px] uppercase tracking-wide text-slate-500">
        Educational visualization · Simplified for learning purposes
      </p>
    </div>
  );
}

export default EducationalCard;
