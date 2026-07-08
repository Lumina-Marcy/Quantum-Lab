import { motion } from 'framer-motion';

/** Animated connector between the classical and quantum panels on Screen 5. */
function ComparisonDivider() {
  return (
    <div className="flex items-center justify-center py-2 lg:h-full lg:py-0">
      <div className="flex flex-col items-center gap-3 px-2 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">
          Same Problem
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300"
        >
          ↓
        </motion.div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">
          Different Search Strategy
        </span>
      </div>
    </div>
  );
}

export default ComparisonDivider;
