import { motion } from 'framer-motion';
import SequentialLines from './SequentialLines';
import { systemReadySignal } from '../utils/systemReadySignal';

const LINES = [
  'BOOTING QUANTUM LAB...',
  'Initializing Computational Space...',
  'Calibrating Quantum Field...',
  'Synchronizing Qubits...',
  'QUANTUM CORE ONLINE █',
];

// A genuine silent beat between the text finishing and the Core beginning to assemble — no
// text, no motion — matching "then... silence... then... tiny particles appear."
const SILENCE_MS = 500;

/**
 * Stage 2 — System Initialization: shown in place of the Hero once "New User" is chosen
 * (`Landing.jsx` swaps them via AnimatePresence — scrolling stays disabled throughout, since this
 * plays before the user has ever been able to scroll at all, not mid-scroll). Brief and fast on
 * purpose: the loading is short, the payoff (the Core assembling from nothing, then one awakening
 * pulse) is the unforgettable part, not this text. `active` triggers the reveal immediately on
 * mount rather than waiting for a scroll-into-view — this section IS the whole screen the instant
 * it appears, there's nothing to scroll toward.
 */
function BootSequence() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <SequentialLines
        lines={LINES}
        showCursor
        active
        stagger={0.42}
        className="space-y-3 font-mono text-sm tracking-wide text-slate-500 sm:text-base [&>*:last-child]:mt-2 [&>*:last-child]:font-semibold [&>*:last-child]:uppercase [&>*:last-child]:tracking-[0.2em] [&>*:last-child]:text-white"
        onComplete={() =>
          // Only ignites the Core's assembly/pulse (AnimatedBackground.jsx) — Nav and the rest of
          // the app now wait for that pulse to actually finish (`onPulseComplete`, wired in
          // Landing.jsx) rather than appearing the instant this text is done. This is also why
          // `navReadySignal` is no longer set here: it's set once at the true pulse-complete
          // moment instead, alongside the rest of the app's arrival.
          setTimeout(() => systemReadySignal.set(1), SILENCE_MS)
        }
      />

      {/* "Look here, not stuck" — reads as part of the cinematic moment, not a loading spinner. */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ opacity: { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }}
        className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-quantum-cyan/60"
      >
        Watch closely
      </motion.p>
    </section>
  );
}

export default BootSequence;
