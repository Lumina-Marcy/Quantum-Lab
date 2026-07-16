import { motion } from 'framer-motion';

const HUBS = [
  { x: 25, y: 60 },
  { x: 140, y: 30 },
  { x: 255, y: 70 },
  { x: 60, y: 190 },
  { x: 220, y: 200 },
];

const ROUTES_A = [[0, 1], [1, 2], [0, 3], [2, 4], [3, 4]];
const ROUTES_B = [[0, 2], [1, 3], [1, 4], [0, 4], [2, 3]];
const CROSSFADE_TIMES = [0, 0.42, 0.58, 1];

function angleBetween(a, b) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/** A tiny paper-airplane silhouette. */
function PlaneGlyph() {
  return <path d="M 0 -6 L 5 4 L 0 1.5 L -5 4 Z" fill="#eff6ff" />;
}
/** A tiny cargo-ship hull silhouette. */
function ShipGlyph() {
  return (
    <g>
      <path d="M -7 2 L 7 2 L 5 6 L -5 6 Z" fill="#eff6ff" />
      <line x1="0" y1="2" x2="0" y2="-5" stroke="#eff6ff" strokeWidth={1.2} />
    </g>
  );
}
/** A tiny delivery-truck silhouette. */
function TruckGlyph() {
  return (
    <g>
      <rect x="-7" y="-3" width="10" height="6" fill="#eff6ff" />
      <rect x="3" y="-1" width="4" height="4" fill="#eff6ff" />
      <circle cx="-4" cy="4" r="1.3" fill="#eff6ff" />
      <circle cx="4" cy="4" r="1.3" fill="#eff6ff" />
    </g>
  );
}

// Each vehicle travels a fixed leg between two hubs, reversing back and forth — real global
// transport (air/sea/ground), not abstract dots, per the brief's own direction for this category.
const VEHICLES = [
  { Glyph: PlaneGlyph, from: HUBS[1], to: HUBS[2], duration: 4.5, delay: 0 },
  { Glyph: ShipGlyph, from: HUBS[0], to: HUBS[4], duration: 6.5, delay: 0.8 },
  { Glyph: TruckGlyph, from: HUBS[3], to: HUBS[4], duration: 3.2, delay: 1.6 },
];

/** Global routes constantly re-optimizing, with planes/ships/trucks actually moving — Optimization's full-card hover story. */
function OptimizationIllustration({ active = false }) {
  return (
    <svg viewBox="0 0 280 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <motion.g
        animate={{ opacity: active ? 1 : 0.16, scale: active ? 1 : 0.94 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <motion.g
          animate={active ? { opacity: [0.6, 0.6, 0, 0] } : { opacity: 0.6 }}
          transition={active ? { duration: 5, repeat: Infinity, ease: 'easeInOut', times: CROSSFADE_TIMES } : { duration: 0.3 }}
        >
          {ROUTES_A.map(([a, b], i) => (
            <line key={i} x1={HUBS[a].x} y1={HUBS[a].y} x2={HUBS[b].x} y2={HUBS[b].y} stroke="#8b5cf6" strokeWidth={1.2} strokeLinecap="round" />
          ))}
        </motion.g>
        <motion.g
          animate={active ? { opacity: [0, 0, 0.6, 0.6] } : { opacity: 0 }}
          transition={active ? { duration: 5, repeat: Infinity, ease: 'easeInOut', times: CROSSFADE_TIMES } : { duration: 0.3 }}
        >
          {ROUTES_B.map(([a, b], i) => (
            <line key={i} x1={HUBS[a].x} y1={HUBS[a].y} x2={HUBS[b].x} y2={HUBS[b].y} stroke="#60a5fa" strokeWidth={1.2} strokeLinecap="round" />
          ))}
        </motion.g>

        {HUBS.map((h, i) => (
          <motion.circle
            key={i}
            cx={h.x}
            cy={h.y}
            r={3}
            fill="#c4b5fd"
            animate={active ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={active ? { duration: 2.4, delay: i * 0.35, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}

        {VEHICLES.map((v, i) => {
          const dx = v.to.x - v.from.x;
          const dy = v.to.y - v.from.y;
          const angle = angleBetween(v.from, v.to);
          return (
            <motion.g
              key={i}
              style={{ rotate: angle }}
              animate={active ? { x: [0, dx, 0], y: [0, dy, 0] } : { x: 0, y: 0 }}
              transition={active ? { duration: v.duration, delay: v.delay, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
            >
              <g transform={`translate(${v.from.x} ${v.from.y})`}>
                <v.Glyph />
              </g>
            </motion.g>
          );
        })}
      </motion.g>
    </svg>
  );
}

export default OptimizationIllustration;
