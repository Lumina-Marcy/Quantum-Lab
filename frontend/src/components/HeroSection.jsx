import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

// A few ambient dots near the decision — not the whole starfield, just a small local cluster
// that brightens on hover so the buttons read as "portals reacting to you," not form controls.
const REACTIVE_DOTS = [
  { x: 22, y: 30, size: 3 },
  { x: 78, y: 26, size: 2.4 },
  { x: 15, y: 68, size: 2 },
  { x: 85, y: 70, size: 2.6 },
  { x: 50, y: 82, size: 2.2 },
  { x: 34, y: 14, size: 1.8 },
  { x: 66, y: 16, size: 2.4 },
];

/**
 * Stage 1 — Arrival: the entry gate, not a scrolling page. `AnimatedBackground.jsx`'s Core now
 * breathes at a genuinely dim, idle level from the first frame (not true 0) rather than being
 * fully "unearned" — so the radial scrim below exists specifically to keep the copy the
 * unambiguous visual priority regardless: it dampens whatever atmosphere sits behind the text
 * block without touching the Core itself, rather than capping the Core's dimness so low it reads
 * as literally off. `Landing.jsx` keeps scrolling disabled until one of `onNewUser`/`onContinue`
 * fires.
 */
function HeroSection({ onNewUser, onContinue }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.section
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      {/* Readability scrim — a soft dark pool behind the copy block only, so the Core's now-dim-
          but-present idle glow never competes with the headline's contrast. Purely additive: no
          layout impact, sits behind the text via normal DOM order. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[56rem] max-w-[90vw] -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(closest-side, rgba(5,8,22,0.55) 0%, transparent 75%)' }}
      />

      {REACTIVE_DOTS.map((d, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full bg-quantum-cyan"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          animate={{ opacity: hovered ? 0.9 : 0.25, scale: hovered ? 1.8 : 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative max-w-3xl"
      >
        <p className="text-lg font-semibold tracking-tight text-white">⚛ Quantum Lab</p>
        <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Experience Tomorrow's Technology.
        </h1>
        <p className="mt-4 font-display text-2xl font-medium leading-snug text-slate-300 sm:text-3xl">
          Not by reading about it. By living it.
        </p>
        <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-slate-400">
          Choose how you'd like to enter.
        </p>
        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Button onClick={onNewUser} variant="primary">
            New User
          </Button>
          <Button onClick={onContinue} variant="secondary">
            Continue Your Journey
          </Button>
        </div>
      </motion.div>
    </motion.section>
  );
}

export default HeroSection;
