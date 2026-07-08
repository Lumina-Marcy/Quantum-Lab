/** Titled content block used for the Grover/Qubit educational deep-dive sections. */
function InfoSection({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-5">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-purple-300">{title}</h4>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export default InfoSection;
