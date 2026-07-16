import { motion } from 'framer-motion';
import { jitter } from '../utils/deterministicRandom';

const COUNT = 26;
const DOTS = Array.from({ length: COUNT }, (_, i) => ({
  id: i,
  x: jitter(i * 4.1 + 2) * 100,
  y: jitter(i * 6.7 + 3) * 100,
  size: 2.5 + jitter(i * 8.3) * 3.5,
}));

/** Background evolution, stage 2: tiny floating particles drifting as one slow, cheap unit. */
function AmbientParticles() {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ x: [0, 12, -8, 0], y: [0, -10, 6, 0] }}
      transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
    >
      {DOTS.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full bg-quantum-cyan/70"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
        />
      ))}
    </motion.div>
  );
}

export default AmbientParticles;
