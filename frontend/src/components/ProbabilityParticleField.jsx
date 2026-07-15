import { motion } from 'framer-motion';
import { jitter } from '../utils/deterministicRandom';
import TravelingSpark from './TravelingSpark';

const CLOUD_COUNT = 220;
const TARGET = { id: 'target', x: 50, y: 35 };

// Uniform-disk polar layout (sqrt of a uniform sample gives uniform area density)
// so the cloud looks organically scattered rather than gridded.
const CLOUD = Array.from({ length: CLOUD_COUNT }, (_, i) => {
  const angle = jitter(i * 2.3) * Math.PI * 2;
  const radius = Math.sqrt(jitter(i * 5.1 + 1)) * 46;
  return { id: i, x: 50 + Math.cos(angle) * radius, y: 35 + Math.sin(angle) * radius * 0.72 };
});

const PARTICLES = [...CLOUD, TARGET];
const CONNECTED = CLOUD.filter((_, i) => i % 8 === 0);
const SPARK_SOURCES = CLOUD.filter((_, i) => i % 40 === 3);

function distanceToTarget(p) {
  return Math.hypot(p.x - TARGET.x, p.y - TARGET.y);
}

function computeParticle(p, step) {
  if (p.id === TARGET.id) {
    const radius = step === 1 ? 1.1 : step === 2 ? 1.8 : step === 3 ? 2.6 : 3.6;
    const opacity = step === 1 ? 0.75 : 1;
    return { radius, opacity, fill: '#4ade80' };
  }

  const proximity = Math.max(0, 1 - distanceToTarget(p) / 55);
  let opacity;
  if (step === 1) opacity = 0.5;
  else if (step === 2) opacity = 0.32 + proximity * 0.18;
  else if (step === 3) opacity = 0.12 + proximity * 0.28;
  else opacity = 0.04 + proximity * 0.12;

  return { radius: 0.7 + proximity * 0.4, opacity, fill: '#64748b' };
}

/**
 * Whole-network probability visualization: hundreds of particles represent the
 * search space, with energy — brightness, ripples, traveling sparks — flowing
 * toward the correct answer as `step` advances, instead of highlighting one dot.
 */
function ProbabilityParticleField({ step }) {
  const sparkDuration = Math.max(1, 2.6 - step * 0.4);

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl sm:h-72">
      <motion.div
        className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent blur-3xl"
        animate={{ x: [0, 15, -10, 0], y: [0, -10, 8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg viewBox="0 0 100 70" className="relative h-full w-full">
        {step >= 2 && (
          <motion.circle
            cx={TARGET.x}
            cy={TARGET.y}
            fill="none"
            stroke="#4ade80"
            strokeWidth={0.4}
            animate={{ r: [2, 32], opacity: [0.5, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
          />
        )}

        {CONNECTED.map((p) => (
          <motion.line
            key={`line-${p.id}`}
            x1={p.x}
            y1={p.y}
            x2={TARGET.x}
            y2={TARGET.y}
            stroke="#4ade80"
            strokeWidth={0.15}
            animate={{ opacity: step === 1 ? 0.04 : [0.05, 0.05 + step * 0.06, 0.05] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: jitter(p.id) }}
          />
        ))}

        {step >= 2 &&
          SPARK_SOURCES.map((p) => (
            <TravelingSpark
              key={`spark-${p.id}`}
              x1={p.x}
              y1={p.y}
              x2={TARGET.x}
              y2={TARGET.y}
              duration={sparkDuration}
              delay={jitter(p.id) * 1.5}
              color="#86efac"
              radius={0.5}
            />
          ))}

        {PARTICLES.map((p) => {
          const { radius, opacity, fill } = computeParticle(p, step);
          const wobble = 2.4 + jitter(typeof p.id === 'number' ? p.id : 999) * 2;
          return (
            <motion.circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={radius}
              fill={fill}
              style={{ transformBox: 'fill-box', transformOrigin: 'center', transition: 'r 0.6s ease' }}
              animate={{
                scale: [0.9, 1.15, 0.9],
                opacity: [opacity * 0.85, opacity, opacity * 0.85],
              }}
              transition={{ duration: wobble, repeat: Infinity, ease: 'easeInOut' }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default ProbabilityParticleField;
