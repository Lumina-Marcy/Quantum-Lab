import { motion, useScroll, useTransform } from 'framer-motion';
import { jitter } from '../utils/deterministicRandom';

const STAR_COUNT = 40;
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  x: jitter(i * 3.7) * 100,
  y: jitter(i * 5.3 + 1) * 100,
  size: 1 + jitter(i * 9.1) * 2,
  delay: jitter(i * 2.2) * 4,
  duration: 3 + jitter(i * 6.6) * 3,
}));

/**
 * Subtle full-bleed backdrop: a faint vignette-masked grid, drifting gradient glows with a
 * scroll-linked parallax drift, and gently pulsing stars. Transform/opacity only (no looped
 * SVG geometry attributes) — that pattern caused a real console-error storm at scale elsewhere
 * this session.
 */
function AnimatedBackground() {
  const { scrollYProgress } = useScroll();
  const blobY1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const blobY3 = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.3], [0.5, 0.15]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950">
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
        className="absolute -left-1/4 -top-1/4 h-[60vw] w-[60vw] rounded-full bg-purple-600/20 blur-3xl"
        animate={{ x: [0, 40, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ y: blobY2 }}
        className="absolute -right-1/4 top-1/3 h-[55vw] w-[55vw] rounded-full bg-cyan-500/15 blur-3xl"
        animate={{ x: [0, -30, 20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ y: blobY3 }}
        className="absolute bottom-0 left-1/3 h-[45vw] w-[45vw] rounded-full bg-violet-600/15 blur-3xl"
        animate={{ x: [0, 20, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {STARS.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-cyan-100"
          style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
          animate={{ opacity: [0.15, 0.8, 0.15], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default AnimatedBackground;
