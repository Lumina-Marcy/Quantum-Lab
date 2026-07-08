import { motion } from 'framer-motion';
import { jitter } from '../utils/deterministicRandom';
import TravelingSpark from './TravelingSpark';

const NODE_COUNT = 22;
const MARGIN = 10;

// Deterministic layout (via `jitter`) so the network looks the same on every render.
const NODES = Array.from({ length: NODE_COUNT }, (_, i) => ({
  id: i,
  x: MARGIN + jitter(i * 3.1) * (100 - MARGIN * 2),
  y: MARGIN + jitter(i * 7.7 + 1) * (100 - MARGIN * 2),
}));

const EDGES = [];
NODES.forEach((_, i) => {
  EDGES.push([i, (i + 1) % NODE_COUNT]);
  if (i % 2 === 0) EDGES.push([i, (i + 5) % NODE_COUNT]);
});

// A short chain of nodes represents the amplified path toward the solution.
const ACTIVE_PATH = [4, 11, 18];
const ACTIVE_EDGES = [
  [ACTIVE_PATH[0], ACTIVE_PATH[1]],
  [ACTIVE_PATH[1], ACTIVE_PATH[2]],
];
const ALL_EDGES = [...EDGES, ...ACTIVE_EDGES];

function isActiveEdge([a, b]) {
  return ACTIVE_PATH.includes(a) && ACTIVE_PATH.includes(b);
}

/** Larger, livelier stand-in for the old NodeGraph: pulsing nodes, traveling sparks, drifting glow. */
function QuantumNetwork() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <motion.div
        className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-transparent blur-3xl"
        animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg viewBox="0 0 100 100" className="relative h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>

        {ALL_EDGES.map(([a, b], i) => {
          const from = NODES[a];
          const to = NODES[b];
          const active = isActiveEdge([a, b]);
          return (
            <motion.line
              key={`${a}-${b}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={active ? '#67e8f9' : '#334155'}
              strokeWidth={active ? 0.6 : 0.25}
              animate={{ opacity: active ? [0.35, 0.9, 0.35] : [0.1, 0.3, 0.1] }}
              transition={{ duration: active ? 1.6 : 3.4, repeat: Infinity, delay: i * 0.04 }}
            />
          );
        })}

        {ACTIVE_EDGES.map(([a, b], i) => (
          <TravelingSpark
            key={`spark-${a}-${b}`}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            duration={1.8}
            delay={i * 0.5}
            radius={1}
          />
        ))}

        {NODES.map((node) => {
          const active = ACTIVE_PATH.includes(node.id);
          return (
            <g key={node.id}>
              {active && <circle cx={node.x} cy={node.y} r={7} fill="url(#nodeGlow)" />}
              <motion.circle
                cx={node.x}
                cy={node.y}
                fill={active ? '#67e8f9' : '#94a3b8'}
                animate={{
                  r: active ? [2.4, 3.4, 2.4] : [1, 1.5, 1],
                  opacity: active ? [0.85, 1, 0.85] : [0.35, 0.75, 0.35],
                }}
                transition={{
                  duration: active ? 1.4 : 2 + jitter(node.id) * 1.5,
                  repeat: Infinity,
                  delay: node.id * 0.07,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default QuantumNetwork;
