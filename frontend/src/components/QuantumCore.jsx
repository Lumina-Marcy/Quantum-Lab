import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { jitter } from '../utils/deterministicRandom';

const STAGE_INTENSITY = {
  dormant: 0,
  awakening: 0.55,
  alive: 1,
  loading: 0.75,
  stabilizing: 1,
  unstable: 0.55,
};

// 'stabilizing' and 'unstable' recolor everything toward emerald/crimson — equilibrium and
// distress read as color, not just brightness. `dash` stays undefined (solid ribbon) for calm
// states; only `unstable` breaks into a jagged stroke.
const VARIANTS = {
  default: { glow: '#3b82f6', core: '#60a5fa', accent: '#a78bfa', nucleus: 'coreNucleus', dash: undefined },
  stabilizing: { glow: '#34d399', core: '#6ee7b7', accent: '#60a5fa', nucleus: 'coreNucleusStable', dash: undefined },
  unstable: { glow: '#ef4444', core: '#f87171', accent: '#fbbf24', nucleus: 'coreNucleusUnstable', dash: '4 3' },
};

// Tilt angle + rx:ry ratio per ring is the classic 2D trick behind "3D atom diagram" graphics —
// each ring is a plain ellipse, statically tilted, then rotated at its own constant speed. No
// WebGL/3D transforms needed. `depth` only scales max opacity/width for a cheap parallax read.
//
// A small, genuinely random (not the codebase's usual deterministic `jitter()`) perturbation is
// applied once per page load — deliberate, per explicit direction that "orbitals should never
// follow the exact same path" and "the homepage should subtly feel different each visit." This is
// the one intentional exception to the deterministic-jitter convention used everywhere else;
// computed once at module scope (not per-render), so it's stable for the whole session, just
// different across separate page loads.
function withPerVisitVariance(orbits) {
  return orbits.map((o) => ({
    ...o,
    tilt: o.tilt + (Math.random() - 0.5) * 10,
    speed: o.speed + (Math.random() - 0.5) * 8,
  }));
}

const ORBITS_FULL = withPerVisitVariance([
  { rx: 96, ry: 34, tilt: -18, speed: 52, dir: 1, depth: 1 },
  { rx: 90, ry: 58, tilt: 35, speed: 71, dir: -1, depth: 0.8 },
  { rx: 80, ry: 30, tilt: 74, speed: 44, dir: 1, depth: 0.65 },
  { rx: 68, ry: 60, tilt: 118, speed: 88, dir: -1, depth: 0.5 },
]);
const ORBITS_MINIMAL = withPerVisitVariance([
  { rx: 90, ry: 40, tilt: -15, speed: 52, dir: 1, depth: 1 },
  { rx: 78, ry: 50, tilt: 50, speed: 71, dir: -1, depth: 0.75 },
]);

// Fixed jagged arc shapes near the nucleus edge, computed once — only their opacity ever animates.
function arcPath(seed) {
  let angle = jitter(seed) * Math.PI * 2;
  let r = 42;
  let x = 100 + Math.cos(angle) * r;
  let y = 100 + Math.sin(angle) * r;
  let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
  for (let i = 0; i < 5; i += 1) {
    r += 7 + jitter(seed + i * 1.7) * 6;
    angle += (jitter(seed + i * 2.3) - 0.5) * 1.1;
    x = 100 + Math.cos(angle) * r;
    y = 100 + Math.sin(angle) * r;
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}
const ARC_PATHS = [arcPath(11.3), arcPath(37.9)];

// Fixed tendril filaments radiating from the nucleus edge — static shape, only opacity pulses.
function tendrilPath(seed) {
  const angle = jitter(seed) * Math.PI * 2;
  const r1 = 45;
  const r2 = 64 + jitter(seed + 1) * 18;
  const midAngle = angle + (jitter(seed + 2) - 0.5) * 0.6;
  const midR = (r1 + r2) / 2 + jitter(seed + 3) * 8;
  const p1 = [100 + Math.cos(angle) * r1, 100 + Math.sin(angle) * r1];
  const pm = [100 + Math.cos(midAngle) * midR, 100 + Math.sin(midAngle) * midR];
  const p2 = [100 + Math.cos(angle) * r2, 100 + Math.sin(angle) * r2];
  return `M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Q ${pm[0].toFixed(1)} ${pm[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
}
const TENDRILS = Array.from({ length: 5 }, (_, i) => tendrilPath(i * 13.7 + 3));

// A small handful of particles escaping outward, on a fixed loop — exactly 3 DOM nodes for the
// component's whole lifetime, matching TravelingSpark.jsx's already-proven bounded pattern rather
// than the ~220-element per-frame-attribute-animation failure mode from elsewhere this session.
const ESCAPEES = [
  { angle: 0.4, duration: 3.6, delay: 0, repeatDelay: 5.2 },
  { angle: 2.7, duration: 4.1, delay: 2.4, repeatDelay: 6.1 },
  { angle: 4.6, duration: 3.3, delay: 4.8, repeatDelay: 4.6 },
];

function orbitParticles(orbit, count, seedBase) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + jitter(seedBase + i * 3.1) * 1.2;
    return {
      x: Math.cos(a) * orbit.rx,
      y: Math.sin(a) * orbit.ry,
      r: 1.2 + jitter(seedBase + i * 6.2) * 0.8,
    };
  });
}

/** One tilted orbital ring: static tilt (+ distortion wobble) → constant-speed rotation → a
 * layered-stroke glow ribbon riding particles. Never animates per-particle cx/cy — particles are
 * plain nested elements that rigidly ride the rotating parent.
 *
 * The ribbon and its particles share the same rotating parent (so particles genuinely ride the
 * orbit) but have their OWN, independently-timed opacity — particles become visible earliest in
 * the intensity range, the ribbon ("orbitals begin forming") last, so a single 0→1 rise reads as
 * "particles appear, then the orbital forms around them" rather than everything popping at once. */
function OrbitRing({ orbit, index, intensity, wobble, distortScale, distortOpacity, colors, full, particleCount }) {
  // Both ranges reach a literal 0 at their low end rather than a small non-zero floor —
  // `useTransform` clamps to the first output value *below* the input range, so a non-zero floor
  // here would mean the Core stays faintly visible even at intensity 0, contradicting "the Core
  // shouldn't appear until it's earned."
  const ringOpacity = useTransform(intensity, [0.45, 1], [0, 0.85 * orbit.depth]);
  const particlesOpacity = useTransform(intensity, [0, 0.35], [0, 0.9 * orbit.depth]);
  const tiltWithWobble = useTransform(wobble, (w) => orbit.tilt + w * orbit.dir);
  const ribbonColor = index % 2 === 0 ? colors.glow : colors.accent;
  const particles = orbitParticles(orbit, particleCount, index * 17 + 5);

  return (
    <motion.g style={{ rotate: tiltWithWobble }}>
      <motion.g animate={{ rotate: orbit.dir * 360 }} transition={{ duration: orbit.speed, repeat: Infinity, ease: 'linear' }}>
        <motion.g style={{ opacity: ringOpacity, scale: distortScale }}>
          {full && (
            <>
              <ellipse cx="100" cy="100" rx={orbit.rx} ry={orbit.ry} fill="none" stroke={ribbonColor} strokeWidth={7} opacity={0.07} />
              <ellipse cx="100" cy="100" rx={orbit.rx} ry={orbit.ry} fill="none" stroke={ribbonColor} strokeWidth={3.4} opacity={0.16} />
            </>
          )}
          <ellipse
            cx="100"
            cy="100"
            rx={orbit.rx}
            ry={orbit.ry}
            fill="none"
            stroke={ribbonColor}
            strokeWidth={full ? 1.6 : 1.8}
            strokeDasharray={colors.dash}
            opacity={0.9}
          />
        </motion.g>
        <motion.g style={{ opacity: particlesOpacity, scale: distortScale }}>
          <motion.g style={{ opacity: distortOpacity }}>
            {particles.map((p, i) => (
              <g key={i} transform={`translate(${(100 + p.x).toFixed(1)} ${(100 + p.y).toFixed(1)})`}>
                <circle r={p.r} fill="#eff6ff" opacity={0.85} />
              </g>
            ))}
          </motion.g>
        </motion.g>
      </motion.g>
    </motion.g>
  );
}

/** Rare electric-arc flicker near the nucleus edge — irregular timing (a jittered setTimeout that
 * reschedules itself) reads as genuinely sporadic, unlike a fixed-interval loop. `enabled` gates
 * the scheduling itself (not just the render), so `detail="minimal"` mounts don't run a hidden
 * timer loop for an arc they never draw — but the hook is still always called, unconditionally,
 * to respect React's rules of hooks regardless of `detail`. */
function useArcFlicker(enabled, minDelaySeconds, maxDelaySeconds) {
  const opacity = useMotionValue(0);

  useEffect(() => {
    if (!enabled) return;
    let timeoutId;
    let cancelled = false;

    function scheduleNext() {
      const delay = (minDelaySeconds + Math.random() * (maxDelaySeconds - minDelaySeconds)) * 1000;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        animate(opacity, [0, 1, 0.2, 0], { duration: 0.35, ease: 'easeOut' });
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled, opacity, minDelaySeconds, maxDelaySeconds]);

  return opacity;
}

/**
 * Quantum Lab's living symbol — a glowing nucleus with tilted orbital rings, particles riding
 * each ring, faint tendrils, rare electric arcs, and particles escaping outward. One `intensity`
 * dial (0→1) drives every visual channel; it can come from a discrete `stage` (animates to a
 * target whenever `stage` changes) or from an external scroll-linked MotionValue via `progress`
 * (bypasses the stage animation entirely — e.g. AnimatedBackground.jsx driving it continuously
 * off scrollYProgress with no per-frame re-renders).
 *
 * Each ring's rotation speed never changes across stages/intensity — only opacity, scale, and
 * color react. That's the actual mechanism behind "calm, organic, breathing" rather than
 * "spinning like a loading icon" — the rings drift at different, non-uniform, often-opposite
 * speeds, which is what makes the whole thing read as independent orbitals instead of one spinning
 * shape. The one exception is `unstable`: entering that stage triggers a brief, one-shot
 * distortion pulse — particles scatter and every ring's tilt jolts off-axis (in alternating
 * directions per ring), then both ease back — layered on top of the base rotation, not replacing it.
 *
 * `detail="minimal"` is for the very small mounts (a ~16-28px loading spinner / mission badge)
 * where layered glow, tendrils, arcs, and escapees would just read as mud — it keeps 2 orbits with
 * a single crisp stroke each and the nucleus's breathing loop, the one thing that must stay
 * recognizable at every size.
 */
function QuantumCore({ stage = 'dormant', progress, className = 'h-64 w-64', particleCount = 10, detail = 'full' }) {
  const internalIntensity = useMotionValue(STAGE_INTENSITY[stage] ?? 0);
  const distortion = useMotionValue(0);
  const full = detail === 'full';

  // `loading` gets its own contract-then-expand keyframe rather than a flat interpolation — a
  // small undershoot below its resting intensity, then an overshoot past it, then settle. Every
  // other stage keeps the plain interpolation; this is specifically "loading" reading as the Core
  // gathering itself before a task, not a straight fade like every other transition.
  useEffect(() => {
    if (progress) return;
    const target = STAGE_INTENSITY[stage] ?? 0;
    const controls =
      stage === 'loading'
        ? animate(internalIntensity, [null, target * 0.55, target * 1.1, target], {
            duration: 1.3,
            times: [0, 0.35, 0.7, 1],
            ease: 'easeOut',
          })
        : animate(internalIntensity, target, { duration: 1.8, ease: 'easeInOut' });
    return controls.stop;
  }, [stage, progress, internalIntensity]);

  useEffect(() => {
    if (stage !== 'unstable') return;
    const controls = animate(distortion, [0, 1, 0], {
      duration: 1.6,
      times: [0, 0.3, 1],
      ease: 'easeOut',
    });
    return controls.stop;
  }, [stage, distortion]);

  const intensity = progress ?? internalIntensity;
  const variant = stage === 'stabilizing' || stage === 'unstable' ? stage : 'default';
  const colors = VARIANTS[variant];

  // Staggered input ranges (not the full [0,1] span each) are what turn one shared 0→1 rise into
  // a sequence — particles first (see OrbitRing), then halo/nucleus ("energy gathering"), then
  // the rings ("orbitals begin forming") — rather than everything brightening in lockstep. Each
  // opacity range starts at a literal 0 (not a small floor) so the Core is genuinely invisible,
  // not just faint, at intensity 0 — it hasn't been earned yet.
  // Peak opacity trimmed (halo 0.55→0.4, nucleus 1→0.85) — the Core was overpowering typography
  // at full intensity; still clearly alive and the room's brightest thing, just no longer blown
  // out. Trimmed globally (every consumer: homepage background, Sandbox, LoadingSpinner) rather
  // than per-context, since "reduce brightness, increase subtlety" reads as a Core-wide intent,
  // not homepage-specific — and none of those other contexts needed the extra intensity either.
  const haloOpacity = useTransform(intensity, [0, 0.55], [0, 0.4]);
  const haloScale = useTransform(intensity, [0, 0.55], [0.82, 1.15]);
  const nucleusOpacity = useTransform(intensity, [0.12, 0.65], [0, 0.85]);
  const nucleusScale = useTransform(intensity, [0.12, 0.65], [0.8, 1]);
  const tendrilOpacity = useTransform(intensity, [0.2, 0.75], [0, 0.45]);

  const ringWobble = useTransform(distortion, [0, 1], [0, 16]);
  const distortScale = useTransform(distortion, [0, 1], [1, 1.6]);
  const distortOpacity = useTransform(distortion, [0, 1], [1, 0.35]);

  const arcFlicker1 = useArcFlicker(full, 6, 14);
  const arcFlicker2 = useArcFlicker(full, 9, 18);

  const orbits = full ? ORBITS_FULL : ORBITS_MINIMAL;
  const perOrbitParticleCount = Math.max(1, Math.round(particleCount / orbits.length));

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          opacity: haloOpacity,
          scale: haloScale,
          background: 'radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(139,92,246,0.3) 45%, transparent 75%)',
        }}
      />

      <svg viewBox="0 0 200 200" className="relative h-full w-full">
        <defs>
          <radialGradient id="coreNucleus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#93c5fd" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coreNucleusStable" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#a7f3d0" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coreNucleusUnstable" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#fca5a5" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tendrils — faint energy radiating from the nucleus. Intensity-driven opacity lives on
            the outer group; the breathing pulse is a separate `animate` on the inner path, since
            combining a `style` motion value with an `animate` keyframe on the same property of
            the same element lets one silently override the other. */}
        {full &&
          TENDRILS.map((d, i) => (
            <motion.g key={i} style={{ opacity: tendrilOpacity }}>
              <motion.path
                d={d}
                stroke={i % 2 === 0 ? colors.glow : colors.accent}
                strokeWidth={0.6}
                strokeLinecap="round"
                fill="none"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 3 + (i % 3) * 0.7, delay: i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.g>
          ))}

        {/* Nucleus — intensity drives brightness/scale; the breathing loop underneath is always
            running, calm and constant, so the core reads as "alive" even dormant. */}
        <motion.g style={{ opacity: nucleusOpacity, scale: nucleusScale }}>
          <motion.circle
            cx="100"
            cy="100"
            r="46"
            fill={`url(#${colors.nucleus})`}
            animate={{ scale: [0.97, 1.03, 0.97], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        </motion.g>

        {orbits.map((orbit, i) => (
          <OrbitRing
            key={i}
            orbit={orbit}
            index={i}
            intensity={intensity}
            wobble={ringWobble}
            distortScale={distortScale}
            distortOpacity={distortOpacity}
            colors={colors}
            full={full}
            particleCount={perOrbitParticleCount}
          />
        ))}

        {/* Rare electric arcs — fixed shapes, only opacity ever animates. */}
        {full && (
          <>
            <motion.path d={ARC_PATHS[0]} stroke={colors.core} strokeWidth={0.9} fill="none" style={{ opacity: arcFlicker1 }} />
            <motion.path d={ARC_PATHS[1]} stroke={colors.core} strokeWidth={0.7} fill="none" style={{ opacity: arcFlicker2 }} />
          </>
        )}

        {/* Escaping particles — exactly 3 fixed elements, looping forever. `cx`/`cy` stay static;
            the outward travel is a `x`/`y` transform (Framer's native animated channel) instead
            of raw SVG-attribute animation, which turned out to intermittently resolve to
            `undefined` here. All three animated arrays share the same keyframe count. */}
        {full &&
          ESCAPEES.map((e, i) => {
            const baseX = 100 + Math.cos(e.angle) * 50;
            const baseY = 100 + Math.sin(e.angle) * 50;
            const dx = Math.cos(e.angle) * 100;
            const dy = Math.sin(e.angle) * 100;
            return (
              <motion.circle
                key={i}
                cx={baseX}
                cy={baseY}
                r={1.1}
                fill="#eff6ff"
                animate={{ x: [0, dx / 2, dx], y: [0, dy / 2, dy], opacity: [0, 1, 0] }}
                transition={{
                  duration: e.duration,
                  delay: e.delay,
                  repeat: Infinity,
                  repeatDelay: e.repeatDelay,
                  ease: 'easeOut',
                }}
              />
            );
          })}
      </svg>
    </div>
  );
}

export default QuantumCore;
