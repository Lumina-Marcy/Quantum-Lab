import { motion } from 'framer-motion';

const LAYERS = [
  [{ x: 30, y: 70 }, { x: 30, y: 130 }, { x: 30, y: 190 }],
  [{ x: 110, y: 40 }, { x: 110, y: 100 }, { x: 110, y: 160 }, { x: 110, y: 210 }],
  [{ x: 190, y: 55 }, { x: 190, y: 115 }, { x: 190, y: 175 }, { x: 190, y: 225 }],
  [{ x: 260, y: 90 }, { x: 260, y: 160 }],
];

const CONNECTIONS = [];
for (let l = 0; l < LAYERS.length - 1; l += 1) {
  LAYERS[l].forEach((a, ai) => {
    LAYERS[l + 1].forEach((b, bi) => {
      if ((ai + bi) % 2 === 0) CONNECTIONS.push([a, b]);
    });
  });
}

/** Neural pathways lighting up layer by layer — Artificial Intelligence's full-card hover story. */
function AIIllustration({ active = false }) {
  return (
    <svg viewBox="0 0 280 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <motion.g
        animate={{ opacity: active ? 1 : 0.16, scale: active ? 1 : 0.94 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {CONNECTIONS.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#8b5cf6"
            strokeWidth={1}
            animate={active ? { opacity: [0.08, 0.6, 0.08] } : { opacity: 0.08 }}
            transition={active ? { duration: 2.6, delay: i * 0.08, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        ))}
        {LAYERS.flat().map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={3.2}
            fill="#c4b5fd"
            animate={active ? { scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 0.6 }}
            transition={active ? { duration: 2.2, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}
      </motion.g>
    </svg>
  );
}

export default AIIllustration;
