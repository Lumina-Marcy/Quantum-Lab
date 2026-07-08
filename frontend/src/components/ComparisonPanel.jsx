import { motion } from 'framer-motion';

const ACCENTS = {
  green: { border: 'border-emerald-500/30 shadow-emerald-500/10', eyebrow: 'text-emerald-300' },
  cyan: { border: 'border-cyan-500/30 shadow-cyan-500/10', eyebrow: 'text-cyan-300' },
};

/** Shared card shell for the two side-by-side search-strategy panels. */
function ComparisonPanel({ eyebrow, title, accent = 'cyan', children }) {
  const { border, eyebrow: eyebrowColor } = ACCENTS[accent] ?? ACCENTS.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex h-full flex-col rounded-2xl border bg-slate-900/80 p-6 shadow-xl ${border}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${eyebrowColor}`}>{eyebrow}</p>
      <h3 className="mt-2 text-xl font-bold text-white">{title}</h3>
      <div className="mt-5 flex-1">{children}</div>
    </motion.div>
  );
}

export default ComparisonPanel;
