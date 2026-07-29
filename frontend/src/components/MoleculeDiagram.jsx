import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { jitter } from '../utils/deterministicRandom';
import { ELEMENT_META } from '../data/elements';

const CENTER = { x: 100, y: 100 };
const RING_RADIUS = 26;
const RING_THRESHOLD = 6; // backbone carbons before the chain bends into a ring motif
const CARBON_CAP = 10; // extra carbons beyond this keep incrementing counters, not drawn nodes
const PENDANT_CAP = 8; // extra nitrogen/oxygen beyond this likewise stop adding drawn nodes

const PALETTE = {
  assembling: { bond: '#475569', glow: 'rgba(34,211,238,0.35)', ring: '#22d3ee' },
  scanning: { bond: '#475569', glow: 'rgba(34,211,238,0.55)', ring: '#22d3ee' },
  destabilizing: { bond: '#ef4444', glow: 'rgba(239,68,68,0.45)', ring: '#f87171' },
  dissolving: { bond: '#ef4444', glow: 'rgba(239,68,68,0.3)', ring: '#f87171' },
  stabilizing: { bond: '#34d399', glow: 'rgba(52,211,153,0.5)', ring: '#6ee7b7' },
  ghost: { bond: '#334155', glow: 'rgba(148,163,184,0.2)', ring: '#64748b' },
};

const SIZE_CLASSES = {
  workspace: 'h-72 w-72 sm:h-80 sm:w-80',
  mini: 'h-16 w-16',
};

// Only carbon/nitrogen/oxygen become drawn bond-graph nodes — hydrogens are folded into the
// composition's ambient glow instead, matching how real skeletal drug diagrams hide hydrogens.
function effectiveOrder(composition, addedAtoms) {
  if (addedAtoms && addedAtoms.length) {
    return addedAtoms.filter((a) => a.element !== 'h');
  }
  const order = [];
  ['c', 'n', 'o'].forEach((element) => {
    for (let i = 0; i < (composition[element] || 0); i += 1) {
      order.push({ element, order: order.length });
    }
  });
  return order;
}

function hashSeed(seedKey) {
  if (typeof seedKey === 'number') return seedKey;
  const str = String(seedKey ?? 'molecule');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % 100000;
  }
  return hash;
}

function buildGraph(composition, addedAtoms, seedNum) {
  const capped = effectiveOrder(composition, addedAtoms).slice(0, CARBON_CAP + PENDANT_CAP);
  const carbons = capped.filter((a) => a.element === 'c').slice(0, CARBON_CAP);
  const pendants = capped.filter((a) => a.element !== 'c').slice(0, PENDANT_CAP);

  const backboneCount = carbons.length;
  const useRing = backboneCount >= RING_THRESHOLD;
  const ringCount = useRing ? Math.min(6, backboneCount) : 0;

  const backbonePositions = [];
  if (useRing) {
    for (let i = 0; i < ringCount; i += 1) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      backbonePositions.push({ x: CENTER.x + RING_RADIUS * Math.cos(angle), y: CENTER.y + RING_RADIUS * Math.sin(angle) });
    }
    for (let i = ringCount; i < backboneCount; i += 1) {
      const dist = RING_RADIUS + 18 * (i - ringCount + 1);
      backbonePositions.push({ x: CENTER.x, y: CENTER.y - dist });
    }
  } else {
    const step = 22;
    const startX = CENTER.x - ((backboneCount - 1) * step) / 2;
    for (let i = 0; i < backboneCount; i += 1) {
      backbonePositions.push({ x: startX + i * step, y: CENTER.y + (i % 2 === 0 ? -10 : 10) });
    }
  }

  const nodes = [];
  const bonds = [];

  carbons.forEach((_, i) => {
    const jx = (jitter(seedNum + i * 3.1) - 0.5) * 6;
    const jy = (jitter(seedNum + i * 5.7) - 0.5) * 6;
    nodes.push({ id: `c-${i}`, element: 'c', x: backbonePositions[i].x + jx, y: backbonePositions[i].y + jy });
    if (i > 0) bonds.push({ from: `c-${i - 1}`, to: `c-${i}`, double: false });
  });
  if (useRing && ringCount === 6) {
    bonds.push({ from: 'c-0', to: 'c-5', double: false });
  }

  pendants.forEach((atom, i) => {
    const targetIdx = backboneCount > 0 ? i % backboneCount : -1;
    const base = targetIdx >= 0 ? backbonePositions[targetIdx] : CENTER;
    const angleOut = (i / Math.max(1, pendants.length)) * Math.PI * 2;
    const dist = 17;
    const x = base.x + dist * Math.cos(angleOut) + (jitter(seedNum + i * 7.3) - 0.5) * 4;
    const y = base.y + dist * Math.sin(angleOut) + (jitter(seedNum + i * 9.1) - 0.5) * 4;
    const id = `${atom.element}-${i}`;
    nodes.push({ id, element: atom.element, x, y });
    // Cosmetic "functional group" flourish: every other same-element pendant renders as a double
    // bond, a decorative complexity marker rather than real valence bookkeeping.
    const sameElementSoFar = pendants.slice(0, i + 1).filter((p) => p.element === atom.element).length;
    bonds.push({ from: targetIdx >= 0 ? `c-${targetIdx}` : null, to: id, double: sameElementSoFar % 2 === 0 });
  });

  let newestId = null;
  if (capped.length) {
    const newestAtom = capped.reduce((a, b) => (b.order > a.order ? b : a));
    const cIdx = carbons.indexOf(newestAtom);
    if (cIdx !== -1) newestId = `c-${cIdx}`;
    else {
      const pIdx = pendants.indexOf(newestAtom);
      if (pIdx !== -1) newestId = `${newestAtom.element}-${pIdx}`;
    }
  }

  return { nodes, bonds, newestId, totalDrawn: capped.length };
}

/**
 * Hand-authored SVG bond-graph diagram for the Lost Medical Breakthrough mission's molecular
 * workspace. Not chemically precise — deliberately "scientifically believable" rather than exact,
 * inspired by real skeletal drug diagrams without reproducing any specific one.
 */
function MoleculeDiagram({ composition, addedAtoms, seedKey = 'molecule', mode = 'assembling', size = 'workspace' }) {
  const seedNum = hashSeed(seedKey);
  const { nodes, bonds, newestId, totalDrawn } = useMemo(
    () => buildGraph(composition, addedAtoms, seedNum),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [composition.c, composition.n, composition.o, addedAtoms?.length, seedNum]
  );
  const palette = PALETTE[mode] || PALETTE.assembling;
  const glowStrength = Math.min(1, 0.2 + (composition.h || 0) / 40); // hydrogens modulate ambient glow only
  const isEmpty = totalDrawn === 0;
  const isDissolving = mode === 'dissolving';
  const isMini = size === 'mini';

  return (
    <div className={`relative ${SIZE_CLASSES[size] || SIZE_CLASSES.workspace}`}>
      <div
        className="pointer-events-none absolute inset-0 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`, opacity: isEmpty ? 0.25 : glowStrength }}
      />
      <motion.svg
        viewBox="0 0 200 200"
        className="relative h-full w-full"
        animate={isDissolving ? {} : { rotate: 360 }}
        transition={isDissolving ? {} : { duration: isMini ? 26 : 40, repeat: Infinity, ease: 'linear' }}
      >
        {isEmpty ? (
          <circle cx={CENTER.x} cy={CENTER.y} r={6} fill="none" stroke={palette.ring} strokeOpacity={0.25} strokeDasharray="2 3" />
        ) : (
          <>
            {bonds.map((bond, i) => {
              const from = nodes.find((n) => n.id === bond.from);
              const to = nodes.find((n) => n.id === bond.to);
              if (!from || !to) return null;
              return (
                <g key={i}>
                  <motion.line
                    stroke={palette.bond}
                    strokeWidth={isMini ? 1 : 1.6}
                    initial={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, pathLength: 0, opacity: 0 }}
                    animate={
                      isDissolving
                        ? { x1: from.x, y1: from.y, x2: to.x, y2: to.y, opacity: 0 }
                        : { x1: from.x, y1: from.y, x2: to.x, y2: to.y, pathLength: 1, opacity: 1 }
                    }
                    transition={{ duration: 0.4 }}
                  />
                  {bond.double && (
                    <motion.line
                      stroke={palette.bond}
                      strokeWidth={isMini ? 0.8 : 1.2}
                      initial={{ x1: from.x, y1: from.y - 2, x2: to.x, y2: to.y - 2, opacity: 0 }}
                      animate={
                        isDissolving
                          ? { x1: from.x, y1: from.y - 2, x2: to.x, y2: to.y - 2, opacity: 0 }
                          : { x1: from.x, y1: from.y - 2, x2: to.x, y2: to.y - 2, opacity: 0.8 }
                      }
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </g>
              );
            })}

            {nodes.map((node) => {
              const meta = ELEMENT_META[node.element];
              const isNewest = node.id === newestId;
              const dispersalAngle = jitter(seedNum + node.x + node.y) * Math.PI * 2;
              return (
                <motion.circle
                  key={node.id}
                  r={isMini ? 2.6 : 5}
                  fill={mode === 'stabilizing' ? palette.ring : meta.color}
                  stroke={mode === 'destabilizing' || mode === 'dissolving' ? palette.ring : 'none'}
                  strokeWidth={1}
                  initial={isNewest && !isMini ? { cx: node.x, cy: node.y, scale: 0.2, opacity: 0 } : { cx: node.x, cy: node.y, scale: 1, opacity: 1 }}
                  animate={
                    isDissolving
                      ? { cx: node.x + Math.cos(dispersalAngle) * 40, cy: node.y + Math.sin(dispersalAngle) * 40, opacity: 0, scale: 0.4 }
                      : { cx: node.x, cy: node.y, scale: 1, opacity: 1 }
                  }
                  transition={{ duration: isDissolving ? 1.1 : 0.4, ease: 'easeOut' }}
                />
              );
            })}
          </>
        )}
      </motion.svg>
    </div>
  );
}

export default MoleculeDiagram;
