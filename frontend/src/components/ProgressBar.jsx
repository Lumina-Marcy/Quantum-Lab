import { motion } from 'framer-motion';

/** Animated fill bar. `value` is 0-100; the fill animates toward it whenever value changes. */
function ProgressBar({
  value = 0,
  duration = 0.6,
  gradient = 'from-emerald-500 to-emerald-300',
  trackClassName = 'bg-slate-800',
}) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${trackClassName}`}>
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        initial={{ width: '0%' }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration, ease: 'easeOut' }}
      />
    </div>
  );
}

export default ProgressBar;
