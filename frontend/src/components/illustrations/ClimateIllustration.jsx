import { motion } from 'framer-motion';
import { jitter } from '../../utils/deterministicRandom';

const CURRENTS = [
  { d: 'M10,60 Q70,30 140,60 T270,60', duration: 5.5 },
  { d: 'M10,95 Q70,125 140,95 T270,95', duration: 6.4 },
  { d: 'M10,190 Q70,165 140,190 T270,190', duration: 5.8 },
  { d: 'M10,225 Q70,250 140,225 T270,225', duration: 6.8 },
];

// Soft drifting cloud blobs above the wind currents.
const CLOUDS = [
  { x: 60, y: 40, r: 26, duration: 32 },
  { x: 190, y: 30, r: 20, duration: 26 },
];

/** Wind currents flowing over ocean currents, clouds drifting — Climate Modeling's hover story. */
function ClimateIllustration({ active = false }) {
  return (
    <svg viewBox="0 0 280 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <motion.g
        animate={{ opacity: active ? 1 : 0.16, scale: active ? 1 : 0.94 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {CLOUDS.map((c, i) => (
          <motion.circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={c.r}
            fill="#93c5fd"
            opacity={0.1}
            animate={active ? { x: [0, 30, 0] } : { x: 0 }}
            transition={active ? { duration: c.duration, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        ))}

        {CURRENTS.map((current, i) => (
          <motion.path
            key={i}
            d={current.d}
            fill="none"
            stroke={i < 2 ? '#60a5fa' : '#a78bfa'}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeDasharray="6 6"
            animate={active ? { strokeDashoffset: [0, -24] } : { strokeDashoffset: 0 }}
            transition={active ? { duration: current.duration, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
          />
        ))}

        {Array.from({ length: 5 }, (_, i) => ({
          x: 30 + jitter(i * 4.4 + 1) * 220,
          y: 130 + jitter(i * 6.6 + 2) * 40,
        })).map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={1.8}
            fill="#c4b5fd"
            animate={active ? { opacity: [0.3, 0.9, 0.3] } : { opacity: 0.3 }}
            transition={active ? { duration: 3, delay: i * 0.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        ))}
      </motion.g>
    </svg>
  );
}

export default ClimateIllustration;
