import { motion } from 'framer-motion';

/**
 * Background evolution, stage 5: a denser, rotated lattice grid, drifting almost imperceptibly.
 *
 * Driven by a `transform` (GPU-composited, effectively free to animate) rather than animating
 * `backgroundPositionX/Y` directly — the latter is a paint property, not a compositor one, so it
 * was forcing a full repaint of this viewport-sized layer on every single frame, forever. Verified
 * live: this one component alone was the dominant reason the homepage measured ~20-30fps even
 * fully idle, versus a steady 60fps on routes without it. The background layer is oversized by
 * exactly one tile-period in each direction so the translate loop never reveals an edge.
 */
function QuantumLattice() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        style={{
          position: 'absolute',
          top: '-84px',
          left: '-48px',
          right: '-48px',
          bottom: '-84px',
          backgroundImage:
            'linear-gradient(60deg, rgba(167,139,250,0.3) 1.5px, transparent 1.5px), linear-gradient(-60deg, rgba(34,211,238,0.26) 1.5px, transparent 1.5px)',
          backgroundSize: '48px 84px',
        }}
        animate={{ x: [0, -48], y: [0, -84] }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export default QuantumLattice;
