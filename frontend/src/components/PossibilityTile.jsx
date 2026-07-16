import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Panel from './Panel';

/**
 * Large "possibility" tile for Stage 3 — Discovery. Default state shows only the category name —
 * huge type, no icon box, no description, generous empty space, because something is about to
 * happen. On hover, the ENTIRE card becomes the animation canvas (the illustration is a full-card
 * absolute layer, not a small container nested inside): the background tints, the illustration's
 * own particles/motion take over most of the card, the title lifts out of the way, and a single
 * revolutionary statement fades in beneath it. `isNeighborActive` lets a directly-connected tile
 * glow softly when hovered from `PossibilityGallery.jsx`'s connector map, without being the
 * hovered tile itself.
 */
function PossibilityTile({ illustration: Illustration, title, statement, index = 0, isNeighborActive = false, onHoverChange }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
      onHoverStart={() => {
        setHovered(true);
        onHoverChange?.(true);
      }}
      onHoverEnd={() => {
        setHovered(false);
        onHoverChange?.(false);
      }}
    >
      <Panel
        className={`group relative h-[22rem] overflow-hidden transition-colors duration-300 hover:border-quantum-violet/40 ${
          isNeighborActive ? 'border-quantum-violet/25' : ''
        }`}
      >
        {/* Background subtly shifts on hover. */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-quantum-violet/10 via-transparent to-quantum-cyan/10"
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        {/* The card itself is the animation canvas — no nested container. */}
        <div className="absolute inset-0">
          <Illustration active={hovered} />
        </div>

        <div className="relative h-full p-8">
          {/*
            Title sizing/positioning, refactored: the old `inset-x-8` here stacked on top of this
            wrapper's own `p-8`, leaving so little width (~140px in the 4-col grid) that `break-words`
            was forced to snap mid-word — "Artificial Intelligence" → "Artificial/Intelligenc/e".
            Fix is threefold: (1) drop the redundant inset, recovering the wasted width; (2) swap
            `break-words` for `text-balance` (Tailwind 3.4+), which only ever breaks between whole
            words and picks even line lengths — no orphaned single letters; (3) replace the old
            `top: 8%/42%` percentage-anchor with `top: 50%` + an animated `y: '-50%'` translate for
            the resting state — `-50%` is relative to the TITLE'S OWN rendered height, so a 1-line
            and a 2-line title both land dead-center regardless of how many lines they wrapped to,
            instead of drifting depending on wrap count (the actual cause of "some sit too high,
            some too low"). Hover still anchors near the top via a plain `top`, since a title with
            no competing description below it was never the complained-about case.
          */}
          <motion.h3
            className="absolute inset-x-0 text-center text-balance font-display text-3xl font-bold leading-tight text-white"
            animate={hovered ? { top: '10%', y: '0%' } : { top: '50%', y: '-50%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {title}
          </motion.h3>

          <div className="absolute inset-x-0 bottom-8 min-h-[5rem] text-center">
            <AnimatePresence>
              {hovered && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
                  className="leading-relaxed text-slate-200"
                >
                  {statement}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

export default PossibilityTile;
