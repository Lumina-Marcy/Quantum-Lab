import { motion } from 'framer-motion';

/** Bottom-right summary card explaining the educational point of the comparison. */
function KeyTakeaway({ points, note }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-slate-900/80 p-6 shadow-xl shadow-purple-500/10"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-300">Key Takeaway</p>
      <ul className="mt-4 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex gap-3 text-sm leading-relaxed text-slate-200">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
            {point}
          </li>
        ))}
      </ul>
      {note && (
        <p className="mt-5 border-t border-slate-700/60 pt-4 text-xs leading-relaxed text-slate-500">{note}</p>
      )}
    </motion.div>
  );
}

export default KeyTakeaway;
