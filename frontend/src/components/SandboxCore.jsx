import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import QuantumCore from './QuantumCore';

/**
 * The Sandbox page's centerpiece — unlike AnimatedBackground.jsx's Core (which is earned through
 * scroll/awakening), this one is always fully alive: there's no journey to gate it behind here.
 * `boosted` lets a sibling (a hovered simulation card) brighten it from outside, in addition to
 * hovering the Core itself — both read as "the Core reacting to attention," just from two sources.
 * A click fires one outward pulse ring, the same visual idiom as the homepage's arc-reactor moment,
 * scoped locally rather than reaching into the shared background.
 *
 * Cursor-reactive tilt: pointer position over the whole hoverable region drives a small physical
 * lean toward the cursor (not a full 3D spin) — raw offsets feed a spring rather than driving
 * rotation directly, so it settles with a little weight instead of snapping, and eases back to
 * dead-center the instant the pointer leaves.
 */
function SandboxCore({ boosted = false, className = 'h-64 w-64 sm:h-72 sm:w-72' }) {
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const pulse = useMotionValue(0);
  const pulseScale = useTransform(pulse, [0, 1], [0.25, 2.1]);
  const pulseOpacity = useTransform(pulse, [0, 0.15, 1], [0, 0.55, 0]);
  const active = hovered || boosted;

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 150, damping: 20 });
  const springY = useSpring(pointerY, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [-1, 1], [8, -8]);
  const rotateY = useTransform(springX, [-1, 1], [-8, 8]);

  const handlePointerMove = (event) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    pointerX.set(Math.max(-1, Math.min(1, x)));
    pointerY.set(Math.max(-1, Math.min(1, y)));
  };

  const handlePointerLeave = () => {
    setHovered(false);
    pointerX.set(0);
    pointerY.set(0);
  };

  const handleClick = () => {
    animate(pulse, [0, 1], { duration: 1.1, ease: 'easeOut' });
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ perspective: 600 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className="pointer-events-none absolute h-full w-full rounded-full"
        style={{
          scale: pulseScale,
          opacity: pulseOpacity,
          background: 'radial-gradient(circle, rgba(191,219,254,0.55) 0%, rgba(59,130,246,0.28) 45%, transparent 75%)',
        }}
      />
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={handleClick}
        animate={{ scale: active ? 1.05 : 1, filter: active ? 'brightness(1.2)' : 'brightness(1)' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ rotateX, rotateY }}
        className="cursor-pointer"
      >
        <QuantumCore stage="alive" className={className} particleCount={12} />
      </motion.div>
    </div>
  );
}

export default SandboxCore;
