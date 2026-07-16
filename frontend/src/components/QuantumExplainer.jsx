import { motion } from 'framer-motion';
import QuantumCore from './QuantumCore';

// Beat 1 — Classical Computing: a row of switches, each rigidly committed to one fixed state.
// No motion toward the other value — that certainty IS the point, so it can contrast with the
// ambiguity of every beat that follows.
const BITS = [1, 0, 1];
function ClassicalBitsVisual() {
  return (
    <div className="flex items-center justify-center gap-4">
      {BITS.map((bit, i) => (
        <div key={i} className="relative h-9 w-16 rounded-full border border-slate-600 bg-quantum-panel/80">
          <motion.div
            className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-300"
            style={{ left: bit ? 'calc(100% - 1.75rem)' : '0.25rem' }}
          />
          <span className={`absolute inset-0 flex items-center font-mono text-xs text-slate-500 ${bit ? 'justify-start pl-2.5' : 'justify-end pr-2.5'}`}>
            {bit}
          </span>
        </div>
      ))}
    </div>
  );
}

// Beat 3 — Superposition: "0" and "1" drift on overlapping orbits around a shared center,
// perpetually crossing through each other rather than settling on one side — never resolving,
// by design, since resolving would be the opposite of the idea.
function SuperpositionVisual() {
  return (
    <div className="relative h-24 w-24">
      <motion.div
        className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-quantum-cyan/50 bg-quantum-cyan/10 font-mono text-sm text-quantum-cyan"
        animate={{ x: [-22, 22, -22], opacity: [0.9, 0.35, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        0
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-quantum-violet/50 bg-quantum-violet/10 font-mono text-sm text-quantum-violet"
        animate={{ x: [22, -22, 22], opacity: [0.35, 0.9, 0.35] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        1
      </motion.div>
    </div>
  );
}

// Beat 4 — Probability: a distribution of bars, each independently breathing at its own pace,
// so the shape of "what's likely" itself keeps shifting rather than settling into one reading.
const PROB_BARS = [0.3, 0.7, 0.45, 0.9, 0.55, 0.25, 0.65];
function ProbabilityVisual() {
  return (
    <div className="flex h-24 items-end justify-center gap-2">
      {PROB_BARS.map((h, i) => (
        <motion.div
          key={i}
          className="w-3 rounded-t-full bg-gradient-to-t from-quantum-cyan/40 to-quantum-cyan"
          style={{ height: `${h * 100}%` }}
          animate={{ scaleY: [1, 1 + (i % 3) * 0.15, 1] }}
          transition={{ duration: 2.4 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
          initial={false}
        />
      ))}
    </div>
  );
}

// Beat 5 — Why It Matters: every branch lit at once (all possibilities explored simultaneously),
// deliberately contrasting Beat 1's single, rigidly-committed switch state.
const TREE_LAYERS = [
  [{ x: 100, y: 10 }],
  [{ x: 40, y: 60 }, { x: 100, y: 60 }, { x: 160, y: 60 }],
  [{ x: 15, y: 110 }, { x: 65, y: 110 }, { x: 100, y: 110 }, { x: 135, y: 110 }, { x: 185, y: 110 }],
];
const TREE_EDGES = [
  [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 1, 2],
  [1, 0, 2, 0], [1, 0, 2, 1], [1, 1, 2, 2], [1, 2, 2, 3], [1, 2, 2, 4],
];
function PossibilityTreeVisual() {
  return (
    <svg viewBox="0 0 200 120" className="h-24 w-40">
      {TREE_EDGES.map(([la, ia, lb, ib], i) => {
        const a = TREE_LAYERS[la][ia];
        const b = TREE_LAYERS[lb][ib];
        return (
          <motion.line
            key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="#60a5fa" strokeWidth={1.2}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.2, delay: i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}
      {TREE_LAYERS.flat().map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x} cy={n.y} r={4}
          fill="#93c5fd"
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      ))}
    </svg>
  );
}

const BEATS = [
  {
    kicker: 'Classical Computing',
    title: 'Today, every computer thinks in certainties.',
    copy: 'Bits are 0 or 1. One state, fully committed, every time.',
    Visual: ClassicalBitsVisual,
  },
  {
    kicker: 'Qubits',
    title: 'Quantum computers think in something else entirely.',
    copy: 'A qubit is the quantum unit of information — and it behaves nothing like a bit.',
    Visual: () => <QuantumCore stage="alive" detail="minimal" className="h-24 w-24" particleCount={6} />,
  },
  {
    kicker: 'Superposition',
    title: 'A qubit can be 0 and 1 — at the same time.',
    copy: "It doesn't choose until the moment it's measured.",
    Visual: SuperpositionVisual,
  },
  {
    kicker: 'Probability',
    title: 'Quantum computers deal in likelihood, not certainty.',
    copy: 'Every possible answer exists at once, each with its own weight.',
    Visual: ProbabilityVisual,
  },
  {
    kicker: 'Why It Matters',
    title: 'That means exploring every path — simultaneously.',
    copy: 'Problems too vast for classical computers become reachable.',
    Visual: PossibilityTreeVisual,
  },
];

/**
 * The homepage's new second act: a short, minimal-copy explainer bridging the awakening and
 * Discovery — Classical Computing → Qubits → Superposition → Probability → Why It Matters →
 * What Quantum Lab Is. Each beat reveals on scroll (the same `whileInView` idiom already used by
 * PossibilityTile/NarrativeDivider — no new scroll-hijacking), alternating side-to-side so it
 * reads as a walk down a hallway rather than a stacked list. The Quantum Core itself is
 * deliberately NOT re-rendered here — it already lives, alive and intensifying, behind every
 * section via AnimatedBackground.jsx, so this section inherits it rather than duplicating it;
 * the one exception is the Qubit beat, which borrows the Core's own minimal-detail rendering as
 * its illustration precisely to tie "qubit" and "the Core" together as the same idea.
 */
function QuantumExplainer() {
  return (
    <section className="relative mx-auto max-w-4xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-quantum-cyan/70">The Laboratory Explains Itself</p>
        <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">What Is Quantum Computing?</h2>
      </motion.div>

      <div className="mt-20 space-y-20">
        {BEATS.map(({ kicker, title, copy, Visual }, i) => (
          <motion.div
            key={kicker}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`flex flex-col items-center gap-8 sm:gap-12 ${i % 2 === 1 ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}
          >
            <div className="flex w-full flex-none items-center justify-center sm:w-48">
              <Visual />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-quantum-violet/70">{kicker}</p>
              <h3 className="mt-3 font-display text-xl font-semibold text-white sm:text-2xl">{title}</h3>
              <p className="mt-2 text-slate-400">{copy}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="mx-auto mt-24 max-w-xl text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-quantum-cyan/70">What Quantum Lab Is</p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">A place to experience these ideas — not just read about them.</h3>
      </motion.div>
    </section>
  );
}

export default QuantumExplainer;
