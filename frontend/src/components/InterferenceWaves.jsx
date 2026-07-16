import { motion } from 'framer-motion';

const RINGS = [18, 30, 42, 54];

/**
 * Background evolution, stage 3: faint concentric interference rings, breathing slowly.
 * The centering translate lives on a plain (non-motion) wrapper — putting it on the same
 * element as a Framer Motion `animate` transform would let Framer Motion's own inline
 * `transform` silently clobber the Tailwind translate classes.
 */
function InterferenceWaves() {
  return (
    <div className="absolute left-1/2 top-1/2 h-[70vw] w-[70vw] -translate-x-1/2 -translate-y-1/2">
      <motion.svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      >
        {RINGS.map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#60a5fa" strokeOpacity="0.45" strokeWidth="0.9" />
        ))}
      </motion.svg>
    </div>
  );
}

export default InterferenceWaves;
