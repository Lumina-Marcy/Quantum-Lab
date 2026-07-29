import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuantumCore from './QuantumCore';
import MoleculeDiagram from './MoleculeDiagram';
import { jitter } from '../utils/deterministicRandom';

const MIN_RADIUS_PCT = 10;
const MAX_RADIUS_PCT = 44;
const CENTER_PCT = 50;

// Evenly spaced with only a small jitter — enough to avoid a perfectly mechanical ring, not enough
// for two adjacent 10-candidate slots (36° apart) to ever cross into each other's space.
function candidateAngle(i, total) {
  return (i / total) * Math.PI * 2 + (jitter(i * 13.7 + 4) - 0.5) * 0.15;
}

// A purely decorative backdrop of faint, untested "possibilities" — not real candidates, just a
// sense of scale (millions of arrangements exist; only 10 are ever actually amplified). Computed
// once at module scope, same idiom as QuantumCore.jsx's fixed ARC_PATHS/TENDRILS.
const POSSIBILITY_FIELD_COUNT = 70;
const POSSIBILITY_FIELD = Array.from({ length: POSSIBILITY_FIELD_COUNT }, (_, i) => {
  const angle = jitter(i * 2.9 + 3) * Math.PI * 2;
  const radius = 8 + jitter(i * 4.3 + 7) * 47;
  return {
    id: i,
    x: CENTER_PCT + Math.cos(angle) * radius,
    y: CENTER_PCT + Math.sin(angle) * radius,
    size: 0.5 + jitter(i * 6.1 + 11) * 0.7,
    delay: jitter(i * 3.7 + 5) * 2.4,
    duration: 2 + jitter(i * 5.3 + 2) * 2,
  };
});

/**
 * Visualizes the Grover-style oracle/diffusion search as candidate molecules branching around a
 * central Quantum Core rather than a bar chart — the underlying math (amplitudes, oracle target,
 * diffusion) lives entirely in the caller; this component only renders it. Likely candidates drift
 * inward toward the Core, unlikely ones drift outward and fade (a continuous, never-discrete
 * elimination model, matching ProbabilityParticleField.jsx's established idiom), until the search
 * collapses onto one surviving, stabilizing candidate. A faint background "possibility field"
 * sells the scale of the real search space; a traveling scan pulse and pulsing connector lines
 * sell "testing" and "combining" happening each round, rather than candidates just glowing in place.
 */
function QuantumMolecularSearch({ candidates, amplitudes, cureIndex, roundPhase, iteration, measuring }) {
  const probs = amplitudes.map((a) => a ** 2);
  const maxProb = Math.max(...probs, 0.0001);
  // Baseline = the starting uniform probability (1/n). Mapping radius off "prob vs. baseline"
  // instead of "prob vs. current max" means every candidate starts at the same well-spaced ring
  // position (all equal to baseline at round 0) instead of all collapsing onto one tight inner
  // radius just because they're all still tied for the lead.
  const baseline = 1 / Math.max(1, candidates.length);
  const liftRange = Math.max(0.0001, maxProb - baseline);

  // Positions computed once per render and shared by both the node layer and the SVG connector/
  // scan-pulse layer beneath it, so the two never drift out of sync with each other.
  const positioned = useMemo(
    () =>
      candidates.map((cand, i) => {
        const isTarget = i === cureIndex;
        const prob = probs[i];
        const relProb = prob / baseline;
        const liftage = Math.max(0, Math.min(1, (prob - baseline) / liftRange));
        const angle = candidateAngle(i, candidates.length);
        const collapsed = measuring && isTarget;
        const hidden = measuring && !isTarget;
        const radiusPct = collapsed ? 0 : MAX_RADIUS_PCT - liftage * (MAX_RADIUS_PCT - MIN_RADIUS_PCT);
        return {
          cand,
          i,
          isTarget,
          relProb,
          collapsed,
          hidden,
          x: CENTER_PCT + Math.cos(angle) * radiusPct,
          y: CENTER_PCT + Math.sin(angle) * radiusPct,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidates, amplitudes, cureIndex, measuring]
  );

  const target = positioned.find((p) => p.isTarget);
  const fieldOpacity = measuring ? 0 : 1;

  return (
    <div className="relative mx-auto h-[22rem] w-full max-w-md sm:h-[26rem]">
      {/* Decorative "millions of possibilities" backdrop — fades away once the search collapses. */}
      <motion.svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {POSSIBILITY_FIELD.map((p) => (
          <motion.circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill="#94a3b8"
            initial={{ opacity: 0 }}
            animate={{ opacity: fieldOpacity === 0 ? 0 : [0.08, 0.22, 0.08] }}
            transition={{ duration: fieldOpacity === 0 ? 1.2 : p.duration, delay: fieldOpacity === 0 ? 0 : p.delay, repeat: fieldOpacity === 0 ? 0 : Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.svg>

      {/* Connector lines from the Core to every candidate, pulsing during diffusion to sell
          "combining" — real amplitude redistribution happening across every candidate at once. */}
      <AnimatePresence>
        {roundPhase === 'diffusion' && !measuring && (
          <motion.svg
            key={`connectors-${iteration}`}
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {positioned.map((p) => (
              <motion.line
                key={p.i}
                x1={CENTER_PCT}
                y1={CENTER_PCT}
                x2={p.x}
                y2={p.y}
                stroke={p.isTarget ? '#22d3ee' : '#475569'}
                strokeWidth={p.isTarget ? 0.6 : 0.3}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.3, ease: 'easeInOut' }}
              />
            ))}
          </motion.svg>
        )}
      </AnimatePresence>

      {/* A single traveling pulse from the Core out to the target and back, once per oracle
          sub-phase — the visual read for "testing/marking this candidate" happening in real time,
          rather than only the static red ring. */}
      <AnimatePresence>
        {roundPhase === 'oracle' && !measuring && target && (
          <motion.svg
            key={`scan-${iteration}`}
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <motion.circle
              r={1.4}
              fill="#f87171"
              initial={{ cx: CENTER_PCT, cy: CENTER_PCT, opacity: 0 }}
              animate={{
                cx: [CENTER_PCT, target.x, CENTER_PCT],
                cy: [CENTER_PCT, target.y, CENTER_PCT],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      <motion.div
        key={`wave-${iteration}-${roundPhase}`}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40"
        initial={{ scale: 0.3, opacity: 0.6 }}
        animate={{ scale: 6, opacity: 0 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <QuantumCore stage={measuring ? 'stabilizing' : 'awakening'} className="h-20 w-20" particleCount={12} />
      </div>

      {positioned.map((p) => {
        const isMarked = p.isTarget && roundPhase === 'oracle' && !measuring;

        return (
          <motion.div
            key={p.i}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-shadow ${
              isMarked ? 'shadow-[0_0_0_2px_rgba(248,113,113,0.7)]' : ''
            }`}
            initial={{ left: `${p.x}%`, top: `${p.y}%`, opacity: 0, scale: 0.4 }}
            animate={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.hidden ? 0 : p.isTarget ? 1 : Math.max(0.25, Math.min(0.9, 0.3 + p.relProb * 0.5)),
              scale: p.collapsed ? 1.6 : 1,
            }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <MoleculeDiagram
              composition={p.cand}
              seedKey={p.cand.formula}
              mode={p.collapsed ? 'stabilizing' : 'ghost'}
              size="mini"
            />
          </motion.div>
        );
      })}
    </div>
  );
}

export default QuantumMolecularSearch;
