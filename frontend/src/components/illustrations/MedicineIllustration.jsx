import { motion } from 'framer-motion';
import { jitter } from '../../utils/deterministicRandom';

function wavePath(xStart, xEnd, yCenter, amplitude, phase, samples = 48) {
  const points = Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples;
    const x = xStart + t * (xEnd - xStart);
    const y = yCenter + Math.sin(t * Math.PI * 3 + phase) * amplitude;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return points.join(' ');
}

const STRAND_A = wavePath(20, 260, 90, 26, 0);
const STRAND_B = wavePath(20, 260, 90, 26, Math.PI);

const RUNG_COUNT = 8;
const RUNGS = Array.from({ length: RUNG_COUNT }, (_, i) => {
  const t = (i + 0.5) / RUNG_COUNT;
  const x = 20 + t * (260 - 20);
  return {
    x,
    yA: 90 + Math.sin(t * Math.PI * 3) * 26,
    yB: 90 + Math.sin(t * Math.PI * 3 + Math.PI) * 26,
  };
});

// A few loose molecule nodes drifting below the helix — "glowing molecules connect."
const MOLECULES = Array.from({ length: 6 }, (_, i) => ({
  x: 30 + jitter(i * 5.3 + 2) * 220,
  y: 140 + jitter(i * 7.1 + 4) * 40,
  r: 2 + jitter(i * 3.9) * 1.6,
}));

// A ribbon that crossfades between an unfolded zigzag and a compact coil — "proteins fold" —
// the same two-configuration crossfade technique used for route/portfolio reorganizing elsewhere.
const PROTEIN_UNFOLDED = 'M 40 220 L 70 205 L 100 225 L 130 205 L 160 225 L 190 205';
const PROTEIN_FOLDED = 'M 40 220 Q 70 235 90 218 Q 110 200 130 216 Q 150 232 160 218 Q 172 206 190 214';
const FOLD_TIMES = [0, 0.4, 0.6, 1];

// Soft, larger cell blobs slowly drifting toward a loose cluster — "cells organize" — distinct
// from the small bright MOLECULES points above (translation via x/y transform, the established
// safe pattern, not raw cx/cy attribute animation).
const CELLS = Array.from({ length: 4 }, (_, i) => ({
  x: 60 + jitter(i * 6.7 + 10) * 170,
  y: 250 + jitter(i * 8.3 + 11) * 30,
  r: 9 + jitter(i * 4.4) * 5,
  dx: (jitter(i * 9.1) - 0.5) * 14,
  dy: (jitter(i * 3.3) - 0.5) * 10,
}));

/** DNA strands assembling, proteins folding, cells organizing, molecules glowing — Medicine's full-card hover story. */
function MedicineIllustration({ active = false }) {
  return (
    <svg viewBox="0 0 280 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <motion.g
        animate={{ opacity: active ? 1 : 0.16, scale: active ? 1 : 0.94 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {[STRAND_A, STRAND_B].map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="#8b5cf6" strokeWidth={5} opacity={0.08} />
            <path d={d} fill="none" stroke="#8b5cf6" strokeWidth={2.4} opacity={0.18} />
            <path d={d} fill="none" stroke={i === 0 ? '#a78bfa' : '#60a5fa'} strokeWidth={1.3} opacity={0.85} />
          </g>
        ))}

        {RUNGS.map((r, i) => (
          <motion.g
            key={i}
            animate={active ? { opacity: [0.15, 0.8, 0.15] } : { opacity: 0.15 }}
            transition={active ? { duration: 3, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          >
            <line x1={r.x} y1={r.yA} x2={r.x} y2={r.yB} stroke="#c4b5fd" strokeWidth={1} />
            <circle cx={r.x} cy={r.yA} r={2.4} fill="#a78bfa" />
            <circle cx={r.x} cy={r.yB} r={2.4} fill="#60a5fa" />
          </motion.g>
        ))}

        {MOLECULES.map((m, i) => (
          <motion.circle
            key={i}
            cx={m.x}
            cy={m.y}
            r={m.r}
            fill="#c4b5fd"
            animate={active ? { scale: [1, 1.4, 1], opacity: [0.4, 0.9, 0.4] } : { scale: 1, opacity: 0.4 }}
            transition={active ? { duration: 2.6, delay: i * 0.25, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}

        {/* Protein folding — crossfades between an unfolded zigzag and a compact coil. */}
        <motion.path
          d={PROTEIN_UNFOLDED}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={1.6}
          strokeLinecap="round"
          animate={active ? { opacity: [0.75, 0.75, 0, 0] } : { opacity: 0.75 }}
          transition={active ? { duration: 5, repeat: Infinity, ease: 'easeInOut', times: FOLD_TIMES } : { duration: 0.3 }}
        />
        <motion.path
          d={PROTEIN_FOLDED}
          fill="none"
          stroke="#a78bfa"
          strokeWidth={1.6}
          strokeLinecap="round"
          animate={active ? { opacity: [0, 0, 0.75, 0.75] } : { opacity: 0 }}
          transition={active ? { duration: 5, repeat: Infinity, ease: 'easeInOut', times: FOLD_TIMES } : { duration: 0.3 }}
        />

        {/* Cells organizing — soft blobs drifting, distinct from the small bright molecule points. */}
        {CELLS.map((c, i) => (
          <motion.circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={c.r}
            fill="#8b5cf6"
            opacity={0.14}
            animate={active ? { x: [0, c.dx, 0], y: [0, c.dy, 0] } : { x: 0, y: 0 }}
            transition={active ? { duration: 8 + i * 1.4, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        ))}
      </motion.g>
    </svg>
  );
}

export default MedicineIllustration;
