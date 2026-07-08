import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const CENTER = { x: 50, y: 70 };
const POLE_TOP = { x: 50, y: 15 };
const POLE_BOTTOM = { x: 50, y: 125 };
const EQUATOR_RX = 35;
const EQUATOR_RY = 10;

// Points on the Bloch sphere's equator represent equal superpositions of |0> and |1>
// (differing only in relative phase), so orbiting the equator to depict "superposition"
// is a deliberate — not arbitrary — choice.
function equatorKeyframes() {
  const steps = 12;
  const cx = [];
  const cy = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    cx.push(CENTER.x + EQUATOR_RX * Math.cos(angle));
    cy.push(CENTER.y + EQUATOR_RY * Math.sin(angle));
  }
  return { cx, cy };
}

const MODES = [
  { id: 'zero', label: '|0⟩' },
  { id: 'one', label: '|1⟩' },
  { id: 'superposition', label: 'Superposition' },
];

/** Beginner-friendly, intentionally-simplified 2D stand-in for a Bloch sphere. */
function BlochSphereMini() {
  const [mode, setMode] = useState('superposition');
  const [flash, setFlash] = useState(null);
  const { cx, cy } = useMemo(equatorKeyframes, []);

  function handleMeasure() {
    const result = Math.random() < 0.5 ? 'zero' : 'one';
    setFlash(result);
    setMode(result);
    setTimeout(() => setFlash(null), 700);
  }

  const dotTarget = mode === 'zero' ? POLE_TOP : mode === 'one' ? POLE_BOTTOM : null;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 140" className="h-56 w-full max-w-[12rem]">
        <ellipse cx={CENTER.x} cy={CENTER.y} rx={45} ry={62} fill="none" stroke="#334155" strokeWidth={1} />
        <ellipse
          cx={CENTER.x}
          cy={CENTER.y}
          rx={EQUATOR_RX}
          ry={EQUATOR_RY}
          fill="none"
          stroke="#475569"
          strokeWidth={0.6}
          strokeDasharray="2 2"
        />
        <line
          x1={POLE_TOP.x}
          y1={POLE_TOP.y - 6}
          x2={POLE_BOTTOM.x}
          y2={POLE_BOTTOM.y + 6}
          stroke="#1e293b"
          strokeWidth={0.6}
        />

        <text x={POLE_TOP.x} y={POLE_TOP.y - 10} textAnchor="middle" className="fill-slate-400 text-[7px]">
          |0⟩
        </text>
        <text x={POLE_BOTTOM.x} y={POLE_BOTTOM.y + 14} textAnchor="middle" className="fill-slate-400 text-[7px]">
          |1⟩
        </text>

        {mode === 'superposition' ? (
          <motion.circle
            key="orbit"
            r={3.2}
            fill="#22d3ee"
            initial={{ cx: cx[0], cy: cy[0] }}
            animate={{ cx, cy }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <motion.circle
            key="pole"
            r={3.2}
            fill="#22d3ee"
            initial={{ cx: dotTarget.x, cy: dotTarget.y }}
            animate={{ cx: dotTarget.x, cy: dotTarget.y }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}

        <AnimatePresence>
          {flash && (
            <motion.circle
              cx={flash === 'zero' ? POLE_TOP.x : POLE_BOTTOM.x}
              cy={flash === 'zero' ? POLE_TOP.y : POLE_BOTTOM.y}
              initial={{ r: 2, opacity: 0.9 }}
              animate={{ r: 16, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              fill="#67e8f9"
            />
          )}
        </AnimatePresence>
      </svg>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              mode === m.id
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {m.label}
          </button>
        ))}
        {mode === 'superposition' && (
          <button
            onClick={handleMeasure}
            className="rounded-full border border-purple-400 bg-purple-500/20 px-3 py-1.5 text-xs text-purple-200 transition-colors hover:bg-purple-500/30"
          >
            Measure
          </button>
        )}
      </div>
    </div>
  );
}

export default BlochSphereMini;
