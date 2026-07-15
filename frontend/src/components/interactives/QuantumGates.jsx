import { useMemo, useState } from 'react';

const TILT = (25 * Math.PI) / 180;
const SIZE = 260;
const RADIUS = SIZE / 2 - 30;
const CENTER = { x: SIZE / 2, y: SIZE / 2 };

function project(x, y, z) {
  return { x, y: -(z * Math.cos(TILT) - y * Math.sin(TILT)) };
}

function toScreen(v) {
  const p = project(v.x, v.y, v.z);
  return { x: CENTER.x + p.x * RADIUS, y: CENTER.y + p.y * RADIUS };
}

// Each gate is a rotation of the Bloch vector (x = <X>, y = <Y>, z = <Z>).
const GATES = {
  X: { apply: (v) => ({ x: v.x, y: -v.y, z: -v.z }), color: '#f87171', desc: 'Flips |0⟩ and |1⟩ (like a classical NOT).' },
  Y: { apply: (v) => ({ x: -v.x, y: v.y, z: -v.z }), color: '#fb923c', desc: 'Flips |0⟩/|1⟩ and flips the phase at the same time.' },
  Z: { apply: (v) => ({ x: -v.x, y: -v.y, z: v.z }), color: '#a78bfa', desc: 'Leaves |0⟩ and |1⟩ alone but flips the phase of |1⟩.' },
  H: { apply: (v) => ({ x: v.z, y: -v.y, z: v.x }), color: '#22d3ee', desc: 'Turns |0⟩ or |1⟩ into an equal superposition of both.' },
  S: { apply: (v) => ({ x: -v.y, y: v.x, z: v.z }), color: '#4ade80', desc: 'A quarter-turn phase rotation — no effect on |0⟩ or |1⟩ alone.' },
};

const INITIAL = { x: 0, y: 0, z: -1 };

const KNOWN_STATES = [
  { label: '|0⟩', v: { x: 0, y: 0, z: -1 } },
  { label: '|1⟩', v: { x: 0, y: 0, z: 1 } },
  { label: '|+⟩', v: { x: -1, y: 0, z: 0 } },
  { label: '|−⟩', v: { x: 1, y: 0, z: 0 } },
  { label: '|+i⟩', v: { x: 0, y: 1, z: 0 } },
  { label: '|−i⟩', v: { x: 0, y: -1, z: 0 } },
];

function findLabel(v) {
  const match = KNOWN_STATES.find((s) => Math.hypot(s.v.x - v.x, s.v.y - v.y, s.v.z - v.z) < 0.05);
  return match?.label ?? null;
}

function applySequence(seq) {
  return seq.reduce((v, key) => GATES[key].apply(v), INITIAL);
}

function QuantumGates() {
  const [sequence, setSequence] = useState([]);
  const [hoveredKey, setHoveredKey] = useState(null);
  const vector = useMemo(() => applySequence(sequence), [sequence]);
  const label = findLabel(vector);
  const pOne = (1 + vector.z) / 2;
  const pZero = 1 - pOne;
  const tip = toScreen(vector);
  const axisHalf = RADIUS * Math.cos(TILT);

  const previewVector = hoveredKey ? GATES[hoveredKey].apply(vector) : null;
  const previewTip = previewVector ? toScreen(previewVector) : null;
  const previewPOne = previewVector ? (1 + previewVector.z) / 2 : null;
  const previewLabel = previewVector ? findLabel(previewVector) : null;

  function addGate(key) {
    setSequence((seq) => [...seq, key]);
  }

  function removeGateAt(index) {
    setSequence((seq) => seq.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <p className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
        A quantum circuit is just a sequence of gates applied to a qubit, one after another. Start at{' '}
        <span className="text-cyan-300">|0⟩</span>. Move your mouse over a gate below to preview what it
        would do (a faint dashed arrow) before you commit to it — click to actually add it to the circuit.
      </p>

      <div className="flex flex-wrap gap-2">
        {Object.entries(GATES).map(([key, gate]) => (
          <button
            key={key}
            onClick={() => addGate(key)}
            onMouseEnter={() => setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey((k) => (k === key ? null : k))}
            title={gate.desc}
            className="rounded-xl px-4 py-2 font-mono font-bold text-slate-950 hover:opacity-90"
            style={{ backgroundColor: gate.color }}
          >
            {key}
          </button>
        ))}
        <button
          onClick={() => setSequence([])}
          className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
        >
          Clear circuit
        </button>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm text-slate-300">|0⟩</span>
          <div className="h-px w-4 shrink-0 bg-slate-600" />
          {sequence.length === 0 && (
            <span className="shrink-0 px-2 text-xs text-slate-500">click a gate above to add it here</span>
          )}
          {sequence.map((key, i) => (
            <div key={i} className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => removeGateAt(i)}
                title="Click to remove"
                className="flex h-9 w-9 items-center justify-center rounded-lg font-mono font-bold text-slate-950"
                style={{ backgroundColor: GATES[key].color }}
              >
                {key}
              </button>
              <div className="h-px w-4 bg-slate-600" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
          <defs>
            <marker id="gates-arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#22d3ee" />
            </marker>
          </defs>
          <circle cx={CENTER.x} cy={CENTER.y} r={RADIUS} fill="none" stroke="#334155" strokeWidth="1" />
          <ellipse
            cx={CENTER.x}
            cy={CENTER.y}
            rx={RADIUS}
            ry={RADIUS * Math.sin(TILT)}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            opacity="0.5"
          />
          <line
            x1={CENTER.x}
            y1={CENTER.y - axisHalf}
            x2={CENTER.x}
            y2={CENTER.y + axisHalf}
            stroke="#475569"
            strokeWidth="1"
          />
          <text x={CENTER.x} y={CENTER.y - axisHalf - 8} fill="#67e8f9" fontSize="13" textAnchor="middle" fontWeight="bold">
            |1⟩
          </text>
          <text x={CENTER.x} y={CENTER.y + axisHalf + 16} fill="#67e8f9" fontSize="13" textAnchor="middle" fontWeight="bold">
            |0⟩
          </text>
          {previewTip && (
            <line
              x1={CENTER.x}
              y1={CENTER.y}
              x2={previewTip.x}
              y2={previewTip.y}
              stroke="#f8fafc"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.6"
            />
          )}
          <line
            x1={CENTER.x}
            y1={CENTER.y}
            x2={tip.x}
            y2={tip.y}
            stroke="#22d3ee"
            strokeWidth="2.5"
            markerEnd="url(#gates-arrowhead)"
          />
        </svg>

        <div className="text-center">
          {label && <p className="text-lg font-semibold text-cyan-300">{label}</p>}
          <div className="mt-1 flex justify-center gap-4 text-sm text-slate-400">
            <span>P(measure 0) = {Math.round(pZero * 100)}%</span>
            <span>P(measure 1) = {Math.round(pOne * 100)}%</span>
          </div>
          <p className="mt-2 h-5 text-xs text-slate-400">
            {hoveredKey && (
              <>
                Preview — apply <span className="font-mono font-bold" style={{ color: GATES[hoveredKey].color }}>{hoveredKey}</span>:{' '}
                {previewLabel ? `${previewLabel}, ` : ''}
                P(measure 1) would become {Math.round(previewPOne * 100)}%
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
        {Object.entries(GATES).map(([key, gate]) => (
          <p key={key}>
            <span className="font-mono font-bold" style={{ color: gate.color }}>
              {key}
            </span>{' '}
            — {gate.desc}
          </p>
        ))}
      </div>
    </div>
  );
}

export default QuantumGates;