import { useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, animate } from 'framer-motion';
import { jitter } from '../utils/deterministicRandom';
import { systemReadySignal } from '../utils/systemReadySignal';
import AmbientParticles from './AmbientParticles';
import InterferenceWaves from './InterferenceWaves';
import QuantumLattice from './QuantumLattice';
import QuantumCore from './QuantumCore';

const STAR_COUNT = 40;
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  x: jitter(i * 3.7) * 100,
  y: jitter(i * 5.3 + 1) * 100,
  size: 1.8 + jitter(i * 9.1) * 2.2,
  delay: jitter(i * 2.2) * 4,
  duration: 3 + jitter(i * 6.6) * 3,
}));

/**
 * Subtle full-bleed backdrop: a faint vignette-masked grid, drifting gradient glows with a
 * scroll-linked parallax drift, gently pulsing stars, and a scroll-driven atmosphere that evolves
 * as the page deepens — deep space → tiny particles → interference waves → quantum lattice —
 * with the Quantum Core as the one persistent, ever-intensifying centerpiece throughout, staying
 * elevated all the way to the homepage's closing CTA rather than stepping back for anything — the
 * Sandbox is no longer part of this journey (it's its own destination, reached via the nav), so
 * there's nothing downstream for the Core to hand off to anymore. The old connected-dot network
 * motif and the abstract "research architecture" line-work stage have both been removed entirely —
 * the former read as generic/off-brand, the latter served no purpose once it was actually visible
 * only where intended (see below) and just added visual noise with nothing to say. The Core is
 * the only "this is the visual identity" element now.
 *
 * Every layer here is driven by raw pixel `scrollY`, not the ratio-based `scrollYProgress` —
 * deliberately. During the Hero/boot/auth gate, the homepage's real content hasn't rendered yet
 * (Landing.jsx returns `null` for it until `entryPhase === 'unlocked'`), so the document's total
 * scrollable range is genuinely ~0 (`scrollHeight === innerHeight`). Dividing by that near-zero
 * range is exactly the kind of degenerate case that makes `scrollYProgress` resolve to ~1
 * (fully-scrolled) instead of 0 — verified live, this was leaking EVERY layer's "deep scroll"
 * values into the bare Hero (interference rings, lattice, parallax blobs all visible at scroll 0),
 * not just the Core's (which is what last pass's fix narrowly addressed). Raw `scrollY` sidesteps
 * this entirely: 0 scrolled pixels is unambiguous regardless of how tall the document currently is,
 * so every layer now correctly reads as fully dormant during the gate and blends in continuously,
 * without a pop, once the real page exists to scroll through.
 *
 * Everything above is gradual and scroll-driven, except one moment: the instant
 * `systemReadySignal` (utils/systemReadySignal.js) flips to 1 — fired by BootSequence.jsx the
 * real moment "SYSTEM READY" finishes revealing, not an approximated scroll position — the Core
 * ignites, an expanding pulse of light sweeps the page, and the ambient layers get a permanent
 * (small) boost. `onPulseComplete` fires once that pulse animation has genuinely finished playing
 * (not a guessed duration) — Landing.jsx uses it to gate the rest of the app's appearance on the
 * pulse actually being done, not on the boot text alone.
 * Transform/opacity only throughout (no looped SVG geometry attributes) — that pattern caused a
 * real console-error storm at scale elsewhere this session.
 */
function AnimatedBackground({ onPulseComplete }) {
  const { scrollY } = useScroll();
  const blobY1 = useTransform(scrollY, [0, 3000], [0, -80]);
  const blobY2 = useTransform(scrollY, [0, 3000], [0, 60]);
  const blobY3 = useTransform(scrollY, [0, 3000], [0, -40]);
  const gridOpacity = useTransform(scrollY, [0, 900], [0.5, 0.15]);

  // The arc-reactor moment: BootSequence.jsx fires systemReadySignal the instant "SYSTEM READY"
  // actually finishes revealing (not an approximated scroll position). `ignitionBoost` spikes
  // bright then settles to a permanently-elevated floor — the lab doesn't just flash and forget,
  // it stays a little more awake for the rest of the session. `pulseFlash` drives one single
  // expanding ring of light across the page, the visible "the lab just came online" moment.
  const ignitionBoost = useMotionValue(0);
  const pulseFlash = useMotionValue(0);

  // The Core "should feel alive — not impatient": rather than sitting at a hard 0 through the
  // whole Hero (the previous "hasn't been earned yet" stance), it now breathes at a genuinely
  // dim, dormant level from the very first frame, then eases up to a still-subtle "awakening"
  // floor over the next several seconds — entirely on its own clock, with no user action needed.
  // Capped low (0.3, well under `alive`'s 1.0) so it never competes with Hero copy; real
  // activation still only happens via `ignitionBoost` (New User) or scroll. Stopped the moment
  // ignition actually fires — no point animating a floor that's about to be dwarfed anyway.
  const idleIntensity = useMotionValue(0.12);

  useEffect(() => {
    const idleControls = animate(idleIntensity, [0.12, 0.12, 0.3], {
      duration: 5,
      times: [0, 0.35, 1],
      ease: 'easeInOut',
    });
    const unsubscribe = systemReadySignal.on('change', (value) => {
      if (value < 1) return;
      idleControls.stop();
      // A deliberate, slower climb (not an instant spike) — this is what gives QuantumCore's own
      // staggered opacity ranges (particles → halo/nucleus → rings) time to actually cascade
      // instead of everything popping in together. Settles to a permanently-elevated floor after.
      animate(ignitionBoost, [0, 1, 0.45], { duration: 2.4, times: [0, 0.7, 1], ease: 'easeOut' });
      // `.then()`, not a hardcoded setTimeout duplicating this animation's own duration+delay —
      // `onPulseComplete` fires the instant this specific animation genuinely finishes playing,
      // which is what lets Landing.jsx gate the rest of the app's appearance on reality rather
      // than a guessed number that would silently drift if this timing is ever tuned again.
      animate(pulseFlash, [0, 1], { duration: 1.4, ease: 'easeOut', delay: 1.6 }).then(() => {
        onPulseComplete?.();
      });
    });
    return () => {
      idleControls.stop();
      unsubscribe();
    };
  }, [idleIntensity, ignitionBoost, pulseFlash, onPulseComplete]);

  const pulseScale = useTransform(pulseFlash, [0, 1], [0.15, 2.4]);
  const pulseOpacity = useTransform(pulseFlash, [0, 0.2, 1], [0, 0.55, 0]);

  // Atmosphere stages spread across total scroll depth — deep space → tiny particles →
  // interference waves → quantum lattice. Each fades in, peaks, then settles to a faint afterglow
  // (never fully to 0) so earlier motifs keep contributing depth. Stars and particles additionally
  // pick up `ignitionBoost` — "particles become more active" the moment the lab wakes up, not just
  // a fixed scroll-position curve. Pixel breakpoints below are the same `ratio * 3000` conversion
  // used for `coreScrollIntensity` — one consistent "full scroll depth" assumption file-wide.
  const starsOpacityBase = useTransform(scrollY, [0, 600, 3000], [1, 0.3, 0.3]);
  const starsOpacity = useTransform([starsOpacityBase, ignitionBoost], ([base, boost]) => Math.min(1, base + boost * 0.25));
  const particlesOpacityBase = useTransform(scrollY, [60, 540, 1020], [0, 0.55, 0.14]);
  const particlesOpacity = useTransform([particlesOpacityBase, ignitionBoost], ([base, boost]) => Math.min(1, base + boost * 0.3));
  const wavesOpacity = useTransform(scrollY, [1140, 1620, 2100], [0, 0.5, 0.14]);
  const latticeOpacity = useTransform(scrollY, [1680, 2160, 2640], [0, 0.5, 0.14]);

  // Ceiling trimmed 0.9 → 0.65 — at full scroll depth the Core was reaching near-maximum
  // intensity and starting to compete with the content around it; this keeps it clearly the
  // brightest, most alive thing on the page without ever fighting typography for attention.
  const coreScrollIntensity = useTransform(scrollY, [0, 300, 900, 2400], [0, 0, 0.4, 0.65]);
  const coreIntensity = useTransform(
    [coreScrollIntensity, ignitionBoost, idleIntensity],
    ([scroll, boost, idle]) => Math.min(1, Math.max(scroll, boost, idle))
  );

  // Cursor-reactive tilt, window-scoped: this whole layer is `pointer-events-none` (so it never
  // steals interaction from real content above it), which means the Core itself can't receive
  // pointer events directly — tracked at the window level instead, normalized against the
  // viewport rather than the Core's own bounding box. Kept deliberately subtle (a couple of
  // degrees, not Sandbox's more pronounced lean) since this is ambient background, not a
  // dedicated interactive centerpiece — "nothing should distract from content."
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 60, damping: 25 });
  const springY = useSpring(pointerY, { stiffness: 60, damping: 25 });
  const coreRotateX = useTransform(springY, [-1, 1], [3, -3]);
  const coreRotateY = useTransform(springX, [-1, 1], [-3, 3]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      pointerX.set(Math.max(-1, Math.min(1, (event.clientX / window.innerWidth - 0.5) * 2)));
      pointerY.set(Math.max(-1, Math.min(1, (event.clientY / window.innerHeight - 0.5) * 2)));
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [pointerX, pointerY]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-quantum-navy">
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: gridOpacity,
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 50% 20%, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 20%, black 0%, transparent 70%)',
        }}
      />

      <motion.div
        style={{ y: blobY1 }}
        className="absolute -left-1/4 -top-1/4 h-[60vw] w-[60vw] rounded-full bg-blue-600/20 blur-3xl"
        animate={{ x: [0, 40, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ y: blobY2 }}
        className="absolute -right-1/4 top-1/3 h-[55vw] w-[55vw] rounded-full bg-blue-500/15 blur-3xl"
        animate={{ x: [0, -30, 20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ y: blobY3 }}
        className="absolute bottom-0 left-1/3 h-[45vw] w-[45vw] rounded-full bg-violet-600/15 blur-3xl"
        animate={{ x: [0, 20, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div style={{ opacity: starsOpacity }} className="absolute inset-0">
        {STARS.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-cyan-100"
            style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
            animate={{ opacity: [0.15, 0.8, 0.15], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      <motion.div style={{ opacity: particlesOpacity }} className="absolute inset-0">
        <AmbientParticles />
      </motion.div>

      <motion.div style={{ opacity: wavesOpacity }} className="absolute inset-0">
        <InterferenceWaves />
      </motion.div>

      <motion.div style={{ opacity: latticeOpacity }} className="absolute inset-0">
        <QuantumLattice />
      </motion.div>

      {/* The arc-reactor pulse — one expanding ring of light, fired once, the instant the boot
          sequence really completes. Everything else in this file reacts gradually to scroll;
          this is the one deliberately abrupt, causal moment. */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ marginTop: '-8vh' }}
      >
        <motion.div
          className="h-[38vw] max-h-[420px] w-[38vw] max-w-[420px] rounded-full"
          style={{
            scale: pulseScale,
            opacity: pulseOpacity,
            background: 'radial-gradient(circle, rgba(191,219,254,0.6) 0%, rgba(59,130,246,0.3) 40%, transparent 70%)',
          }}
        />
      </motion.div>

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ marginTop: '-8vh', perspective: 800 }}
      >
        <motion.div style={{ rotateX: coreRotateX, rotateY: coreRotateY }}>
          <QuantumCore progress={coreIntensity} className="h-[38vw] w-[38vw] max-h-[420px] max-w-[420px]" />
        </motion.div>
      </div>

    </div>
  );
}

export default AnimatedBackground;
