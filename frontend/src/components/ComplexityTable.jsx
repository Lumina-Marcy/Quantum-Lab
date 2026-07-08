/** Side-by-side classical vs. quantum complexity comparison, matching Screen 5's accent colors. */
function ComplexityTable({ classical, quantum }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-emerald-300">Classical Search</p>
        <p className="mt-2 font-mono text-2xl text-emerald-200">{classical}</p>
      </div>
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-cyan-300">Quantum Search</p>
        <p className="mt-2 font-mono text-2xl text-cyan-200">{quantum}</p>
      </div>
    </div>
  );
}

export default ComplexityTable;
