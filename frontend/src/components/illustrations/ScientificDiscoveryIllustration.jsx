import { motion } from 'framer-motion';

// The same tilted-ellipse-orbit trick as QuantumCore.jsx, at card scale — a small deliberate echo:
// "atoms assemble, orbitals appear" is literally the Core's own visual language in miniature.
const ORBITS = [
  { rx: 110, ry: 40, tilt: -20, speed: 46, dir: 1 },
  { rx: 95, ry: 60, tilt: 40, speed: 60, dir: -1 },
  { rx: 80, ry: 34, tilt: 85, speed: 38, dir: 1 },
];

const CX = 140;
const CY = 130;

/** Atoms assembling and orbitals appearing — Scientific Discovery's full-card hover story. */
function ScientificDiscoveryIllustration({ active = false }) {
  return (
    <svg viewBox="0 0 280 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <motion.g
        animate={{ opacity: active ? 1 : 0.16, scale: active ? 1 : 0.9 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: `${CX}px ${CY}px` }}
      >
        <motion.circle
          cx={CX}
          cy={CY}
          r={16}
          fill="#a78bfa"
          animate={active ? { scale: [0.95, 1.08, 0.95], opacity: [0.7, 1, 0.7] } : { scale: 0.95, opacity: 0.7 }}
          transition={active ? { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />

        {ORBITS.map((orbit, i) => (
          <g key={i} transform={`rotate(${orbit.tilt} ${CX} ${CY})`}>
            <motion.g
              animate={active ? { rotate: orbit.dir * 360 } : { rotate: 0 }}
              transition={active ? { duration: orbit.speed, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
              style={{ transformBox: 'view-box', transformOrigin: `${CX}px ${CY}px` }}
            >
              <ellipse cx={CX} cy={CY} rx={orbit.rx} ry={orbit.ry} fill="none" stroke={i % 2 === 0 ? '#60a5fa' : '#a78bfa'} strokeWidth={1.4} opacity={0.7} />
              <circle cx={CX + orbit.rx} cy={CY} r={2.6} fill="#eff6ff" />
            </motion.g>
          </g>
        ))}
      </motion.g>
    </svg>
  );
}

export default ScientificDiscoveryIllustration;
