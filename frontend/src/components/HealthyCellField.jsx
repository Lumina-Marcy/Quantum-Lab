import { motion } from 'framer-motion';
import { jitter } from '../utils/deterministicRandom';

const CELL_COUNT = 14;

function buildCells() {
  return Array.from({ length: CELL_COUNT }, (_, i) => {
    const angle = jitter(i * 5.3 + 2) * Math.PI * 2;
    const radius = 30 + jitter(i * 7.1 + 1) * 60;
    return {
      id: i,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius * 0.6,
      size: 3 + jitter(i * 3.7) * 4,
      duration: 3 + jitter(i * 9.3) * 3,
      delay: jitter(i * 4.1) * 2,
    };
  });
}
const CELLS = buildCells();

// Decorative debrief backdrop — soft pulsing green blobs suggesting healthy tissue surrounding the
// discovered molecule. Purely ambient, same scale of effort as TravelingSpark.jsx.
function HealthyCellField() {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {CELLS.map((cell) => (
        <motion.circle
          key={cell.id}
          cx={cell.x}
          cy={cell.y}
          r={cell.size}
          fill="#34d399"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.08, 0.22, 0.08], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: cell.duration, delay: cell.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      ))}
    </svg>
  );
}

export default HealthyCellField;
