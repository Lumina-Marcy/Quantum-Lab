import { useRef, useState } from 'react';
import { animate } from 'framer-motion';

const TILT = (25 * Math.PI) / 180;
const SIZE = 260;
const RADIUS = SIZE / 2 - 30;
const CENTER = { x: SIZE / 2, y: SIZE / 2 };
const ROTATE_MS = 700;

function project(x, y, z) {
  return { x, y: -(z * Math.cos(TILT) - y * Math.sin(TILT)) };
}

function toScreen(v) {
  const p = project(v.x, v.y, v.z);
  return { x: CENTER.x + p.x * RADIUS, y: CENTER.y + p.y * RADIUS };
}

function normalizeAxis(a) {
  const len = Math.hypot(a.x, a.y, a.z);
  return { x: a.x / len, y: a.y / len, z: a.z / len };
}

// Rodrigues' rotation formula — rotates vector v by `angle` radians about unit `axis`. Every
// single-qubit gate below is defined as one specific axis + angle, so this same formula both
// computes the gate's final state (angle) AND drives the animation (angle * progress, for
// progress 0→1) — the mid-rotation frames are physically real intermediate qubit states, not
// just a cosmetic tween. A generic straight-line or slerp interpolation between the start/end
// points would break down exactly on the flips shown in the lesson (X, Y, Z, H are all 180°
// rotations, and |0⟩→|1⟩ lands on the exact antipode, where slerp's rotation axis is undefined).
function rotateAboutAxis(v, axis, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = axis.x * v.x + axis.y * v.y + axis.z * v.z;
  const cross = {
    x: axis.y * v.z - axis.z * v.y,
    y: axis.z * v.x - axis.x * v.z,
    z: axis.x * v.y - axis.y * v.x,
  };
  return {
    x: v.x * cos + cross.x * sin + axis.x * dot * (1 - cos),
    y: v.y * cos + cross.y * sin + axis.y * dot * (1 - cos),
    z: v.z * cos + cross.z * sin + axis.z * dot * (1 - cos),
  };
}

// Every single-qubit gate is a rotation of the Bloch vector (x = <X>, y = <Y>, z = <Z>) about a
// fixed axis — that rotation IS the gate, geometrically. (H's axis sits diagonally between X and Z
// because Hadamard is the one gate here that swaps the roles of those two axes.)
const GATES = {
  X: { axis: { x: 1, y: 0, z: 0 }, angle: Math.PI, color: '#f87171', desc: 'Flips |0⟩ and |1⟩ (like a classical NOT) — a 180° spin about the X-axis.' },
  Y: { axis: { x: 0, y: 1, z: 0 }, angle: Math.PI, color: '#fb923c', desc: 'Flips |0⟩/|1⟩ and flips the phase at the same time — a 180° spin about the Y-axis.' },
  Z: { axis: { x: 0, y: 0, z: 1 }, angle: Math.PI, color: '#a78bfa', desc: 'Leaves |0⟩ and |1⟩ alone but flips the phase of |1⟩ — a 180° spin about the Z-axis.' },
  H: { axis: normalizeAxis({ x: 1, y: 0, z: 1 }), angle: Math.PI, color: '#22d3ee', desc: 'Turns |0⟩ or |1⟩ into an equal superposition of both — a 180° spin about the diagonal axis between X and Z.' },
  S: { axis: { x: 0, y: 0, z: 1 }, angle: Math.PI / 2, color: '#4ade80', desc: 'A quarter-turn phase rotation about the Z-axis — no effect on |0⟩ or |1⟩ alone.' },
};

function applyGate(key, v) {
  const gate = GATES[key];
  return rotateAboutAxis(v, gate.axis, gate.angle);
}

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

function QuantumGates() {
  const [sequence, setSequence] = useState([]);
  const [displayVector, setDisplayVector] = useState(INITIAL);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const controlsRef = useRef(null);

  const label = findLabel(displayVector);
  const pOne = (1 + displayVector.z) / 2;
  const pZero = 1 - pOne;
  const tip = toScreen(displayVector);
  const axisHalf = RADIUS * Math.cos(TILT);

  const previewVector = hoveredKey && !isRotating ? applyGate(hoveredKey, displayVector) : null;
  const previewTip = previewVector ? toScreen(previewVector) : null;
  const previewPOne = previewVector ? (1 + previewVector.z) / 2 : null;
  const previewLabel = previewVector ? findLabel(previewVector) : null;

  function addGate(key) {
    if (isRotating) return;
    const gate = GATES[key];
    const from = displayVector;
    setIsRotating(true);
    controlsRef.current?.stop();
    controlsRef.current = animate(0, 1, {
      duration: ROTATE_MS / 1000,
      ease: 'easeInOut',
      onUpdate: (t) => setDisplayVector(rotateAboutAxis(from, gate.axis, gate.angle * t)),
      onComplete: () => {
        setSequence((seq) => [...seq, key]);
        setIsRotating(false);
      },
    });
  }

  function removeGateAt(index) {
    controlsRef.current?.stop();
    setIsRotating(false);
    const next = sequence.filter((_, i) => i !== index);
    setSequence(next);
    setDisplayVector(next.reduce((v, key) => applyGate(key, v), INITIAL));
  }

  function clearCircuit() {
    controlsRef.current?.stop();
    setIsRotating(false);
    setSequence([]);
    setDisplayVector(INITIAL);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm leading-relaxed text-slate-300">
        <p>
          A <span className="font-semibold text-cyan-300">single-qubit gate</span> is an operation that acts on
          exactly one qubit — it takes whatever state <span className="font-mono">|ψ⟩</span> that qubit is in and
          rotates it to a new state. Every possible state of one qubit lives somewhere on the surface of the{' '}
          <span className="text-cyan-300">Bloch sphere</span> below, so a single-qubit gate is, quite literally,
          nothing more than spinning that sphere's arrow to a new position.
        </p>
        <p className="mt-2">
          That's also what makes it "single-qubit": it only ever touches one qubit's own arrow. A{' '}
          <span className="text-slate-200">multi-qubit gate</span> (like CNOT) reaches across two or more qubits
          at once and can link them together — <span className="text-slate-200">entanglement</span> — which no
          amount of single-qubit gates, however many you chain, can ever produce on their own.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(GATES).map(([key, gate]) => (
          <button
            key={key}
            onClick={() => addGate(key)}
            onMouseEnter={() => setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey((k) => (k === key ? null : k))}
            disabled={isRotating}
            title={gate.desc}
            className="rounded-xl px-4 py-2 font-mono font-bold text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: gate.color }}
          >
            {key}
          </button>
        ))}
        <button
          onClick={clearCircuit}
          disabled={isRotating}
          className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear circuit
        </button>
      </div>

      {/* Circuit diagram: |ψ⟩ on the wire, one box per gate applied so far, and the resulting
          output state — the same "wire in, gate box, wire out" notation the lesson video uses,
          just extended to a chain of boxes instead of always exactly one. */}
      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm text-slate-300">|ψ⟩</span>
          <div className="h-px w-4 shrink-0 bg-slate-600" />
          {sequence.length === 0 && (
            <span className="shrink-0 px-2 text-xs text-slate-500">click a gate above to add it here</span>
          )}
          {sequence.map((key, i) => (
            <div key={i} className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => removeGateAt(i)}
                disabled={isRotating}
                title="Click to remove"
                className="flex h-9 w-9 items-center justify-center rounded-lg font-mono font-bold text-slate-950 disabled:cursor-not-allowed"
                style={{ backgroundColor: GATES[key].color }}
              >
                {key}
              </button>
              <div className="h-px w-4 bg-slate-600" />
            </div>
          ))}
          {sequence.length > 0 && (
            <span className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm text-slate-300">
              {label ?? '|ψ̄⟩'}
            </span>
          )}
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
            {hoveredKey && !isRotating && (
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
