import { motion } from 'framer-motion';

// A hexagonally-packed lattice — a crystal structure growing outward from a seed at the center,
// rather than the square grid used elsewhere — nodes/bonds farther from center are delayed
// proportionally, so one breathing cycle reads as "growth radiating outward."
const SPACING = 30;
const ROW_HEIGHT = SPACING * 0.87;
const CENTER = { x: 140, y: 150 };

const NODES = [];
for (let row = -3; row <= 3; row += 1) {
  const offsetX = row % 2 !== 0 ? SPACING / 2 : 0;
  for (let col = -3; col <= 3; col += 1) {
    const x = CENTER.x + col * SPACING + offsetX;
    const y = CENTER.y + row * ROW_HEIGHT;
    const dist = Math.hypot(x - CENTER.x, y - CENTER.y);
    if (dist < 95) NODES.push({ x, y, dist });
  }
}

const BOND_TOLERANCE = 3;
const BONDS = [];
for (let i = 0; i < NODES.length; i += 1) {
  for (let j = i + 1; j < NODES.length; j += 1) {
    const d = Math.hypot(NODES[i].x - NODES[j].x, NODES[i].y - NODES[j].y);
    if (Math.abs(d - SPACING) < BOND_TOLERANCE) {
      BONDS.push({ a: NODES[i], b: NODES[j], dist: Math.max(NODES[i].dist, NODES[j].dist) });
    }
  }
}

const CYCLE = 4.5;

/** A crystal lattice growing outward from a seed point — Materials' full-card hover story. */
function MaterialsIllustration({ active = false }) {
  return (
    <svg viewBox="0 0 280 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <motion.g
        animate={{ opacity: active ? 1 : 0.16, scale: active ? 1 : 0.94 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {BONDS.map((b, i) => (
          <motion.line
            key={i}
            x1={b.a.x}
            y1={b.a.y}
            x2={b.b.x}
            y2={b.b.y}
            stroke="#8b5cf6"
            strokeWidth={1}
            animate={active ? { opacity: [0, 0.6, 0.6, 0] } : { opacity: 0 }}
            transition={active ? { duration: CYCLE, delay: (b.dist / 95) * 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        ))}
        {NODES.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={2}
            fill="#c4b5fd"
            animate={active ? { opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.6] } : { opacity: 0, scale: 0.6 }}
            transition={active ? { duration: CYCLE, delay: (n.dist / 95) * 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}
      </motion.g>
    </svg>
  );
}

export default MaterialsIllustration;
