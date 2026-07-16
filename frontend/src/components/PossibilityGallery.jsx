import { useState } from 'react';
import { motion } from 'framer-motion';
import PossibilityTile from './PossibilityTile';

// 8 categories divide evenly into a 4-column x 2-row grid — no incomplete row, no centering
// hack needed. Tile centers (percent of the gallery's own box), matching `lg:grid-cols-4` below.
const POSITIONS = [
  { x: 12.5, y: 25 },
  { x: 37.5, y: 25 },
  { x: 62.5, y: 25 },
  { x: 87.5, y: 25 },
  { x: 12.5, y: 75 },
  { x: 37.5, y: 75 },
  { x: 62.5, y: 75 },
  { x: 87.5, y: 75 },
];

// A sparse node-network connecting geometrically-adjacent tiles — reinforcing the same
// "everything is connected" idea the rest of the page carries.
const CONNECTORS = [
  [0, 1], [1, 2], [2, 3],
  [4, 5], [5, 6], [6, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

/**
 * Turns the Discovery tiles into a living gallery: a faint connector network behind the grid
 * that brightens along the hovered tile's own edges, so a directly-connected neighbor visibly
 * reacts too — not just whatever the cursor happens to be over.
 */
function PossibilityGallery({ items }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      >
        {CONNECTORS.map(([a, b], i) => {
          const active = hovered === a || hovered === b;
          return (
            <motion.line
              key={i}
              x1={POSITIONS[a].x}
              y1={POSITIONS[a].y}
              x2={POSITIONS[b].x}
              y2={POSITIONS[b].y}
              stroke={active ? '#60a5fa' : '#334155'}
              strokeWidth={active ? 0.35 : 0.15}
              animate={{ opacity: active ? [0.55, 0.95, 0.55] : 0.25 }}
              transition={{ duration: active ? 1.3 : 0.5, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
            />
          );
        })}
      </svg>

      <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => {
          const isNeighborActive =
            hovered !== null &&
            hovered !== i &&
            CONNECTORS.some(([a, b]) => (a === i && b === hovered) || (b === i && a === hovered));

          return (
            <PossibilityTile
              key={item.title}
              illustration={item.illustration}
              title={item.title}
              statement={item.statement}
              index={i}
              isNeighborActive={isNeighborActive}
              onHoverChange={(isHovering) => setHovered(isHovering ? i : null)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default PossibilityGallery;
