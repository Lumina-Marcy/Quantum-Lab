import { useState } from 'react';

const TILT = (25 * Math.PI) / 180;
const MAIN_SIZE = 180;
const MAIN_RADIUS = MAIN_SIZE / 2 - 22;
const MINI_SIZE = 96;
const MINI_RADIUS = MINI_SIZE / 2 - 16;
const DEFAULT_ANGLES = { theta: Math.PI / 2, phi: 0 };

function project(x, y, z) {
  return { x, y: -(z * Math.cos(TILT) - y * Math.sin(TILT)) };
}

function toScreen(x, y, z, size, radius) {
  const p = project(x, y, z);
  return { x: size / 2 + p.x * radius, y: size / 2 + p.y * radius };
}

function pOneFromTheta(theta) {
  return Math.cos(theta / 2) ** 2;
}

function MainQubitSphere({ angles, onMove, onLeave }) {
  const { theta, phi } = angles;
  const x3 = Math.sin(theta) * Math.cos(phi);
  const y3 = Math.sin(theta) * Math.sin(phi);
  const z3 = Math.cos(theta);
  const tip = toScreen(x3, y3, z3, MAIN_SIZE, MAIN_RADIUS);
  const center = MAIN_SIZE / 2;
  const axisHalf = MAIN_RADIUS * Math.cos(TILT);

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = (e.clientX - cx) / (rect.width / 2);
    let dy = (e.clientY - cy) / (rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    onMove({ theta: ((dy + 1) / 2) * Math.PI, phi: dx * Math.PI });
  }

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={onLeave}
      className="relative cursor-crosshair select-none"
      style={{ width: MAIN_SIZE, height: MAIN_SIZE }}
    >
      <svg viewBox={`0 0 ${MAIN_SIZE} ${MAIN_SIZE}`} width={MAIN_SIZE} height={MAIN_SIZE}>
        <defs>
          <marker id="wave-qubit-arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#22d3ee" />
          </marker>
        </defs>
        <circle cx={center} cy={center} r={MAIN_RADIUS} fill="rgba(34,211,238,0.05)" stroke="#334155" strokeWidth="1" />
        <ellipse
          cx={center}
          cy={center}
          rx={MAIN_RADIUS}
          ry={MAIN_RADIUS * Math.sin(TILT)}
          fill="none"
          stroke="#334155"
          strokeWidth="1"
          opacity="0.5"
        />
        <line x1={center} y1={center - axisHalf} x2={center} y2={center + axisHalf} stroke="#475569" strokeWidth="1" />
        <text x={center} y={center - axisHalf - 8} fill="#67e8f9" fontSize="13" textAnchor="middle" fontWeight="bold">
          |1⟩
        </text>
        <text x={center} y={center + axisHalf + 16} fill="#67e8f9" fontSize="13" textAnchor="middle" fontWeight="bold">
          |0⟩
        </text>
        <line
          x1={center}
          y1={center}
          x2={tip.x}
          y2={tip.y}
          stroke="#22d3ee"
          strokeWidth="2.5"
          markerEnd="url(#wave-qubit-arrowhead)"
        />
      </svg>
    </div>
  );
}

function OutcomeSphere({ pointsToOne, probability, color }) {
  const tip = pointsToOne ? toScreen(0, 0, 1, MINI_SIZE, MINI_RADIUS) : toScreen(0, 0, -1, MINI_SIZE, MINI_RADIUS);
  const center = MINI_SIZE / 2;
  const axisHalf = MINI_RADIUS * Math.cos(TILT);

  return (
    <div className="flex items-center gap-3">
      <svg viewBox={`0 0 ${MINI_SIZE} ${MINI_SIZE}`} width={MINI_SIZE} height={MINI_SIZE}>
        <circle cx={center} cy={center} r={MINI_RADIUS} fill="rgba(34,211,238,0.05)" stroke="#334155" strokeWidth="1" />
        <ellipse
          cx={center}
          cy={center}
          rx={MINI_RADIUS}
          ry={MINI_RADIUS * Math.sin(TILT)}
          fill="none"
          stroke="#334155"
          strokeWidth="1"
          opacity="0.5"
        />
        <line x1={center} y1={center - axisHalf} x2={center} y2={center + axisHalf} stroke="#475569" strokeWidth="1" />
        <text x={center} y={center - axisHalf - 5} fill="#67e8f9" fontSize="10" textAnchor="middle" fontWeight="bold">
          1
        </text>
        <text x={center} y={center + axisHalf + 12} fill="#67e8f9" fontSize="10" textAnchor="middle" fontWeight="bold">
          0
        </text>
        <line x1={center} y1={center} x2={tip.x} y2={tip.y} stroke={color} strokeWidth="2.5" />
        <circle cx={tip.x} cy={tip.y} r="3" fill={color} />
      </svg>
      <span className="text-lg font-semibold" style={{ color }}>
        {Math.round(probability * 100)}%
      </span>
    </div>
  );
}

function QuantumPanel() {
  const [angles, setAngles] = useState(DEFAULT_ANGLES);
  const pOne = pOneFromTheta(angles.theta);
  const pZero = 1 - pOne;

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
      <h3 className="text-lg font-semibold text-white">Superposition & Measurement</h3>
      <p className="mt-2 text-sm text-slate-400">
        Move your mouse over the sphere to put the qubit in different superpositions. Measuring it can
        only ever return one of two outcomes, <span className="text-emerald-300">0</span> or{' '}
        <span className="text-rose-300">1</span> — the two small spheres on the right show each outcome's
        odds, updating live as you move.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        <MainQubitSphere angles={angles} onMove={setAngles} onLeave={() => setAngles(DEFAULT_ANGLES)} />

        <div className="flex flex-col items-center gap-1 text-xs text-slate-500">
          <span className="uppercase tracking-wide">Measurement</span>
          <span className="text-lg">→</span>
        </div>

        <div className="flex flex-col gap-3">
          <OutcomeSphere pointsToOne={false} probability={pZero} color="#34d399" />
          <OutcomeSphere pointsToOne={true} probability={pOne} color="#fb7185" />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Before you measure, the qubit is a blend of both — the main sphere's arrow can point anywhere.
        After you measure, it's always one or the other, never both: that's the collapse superposition is
        famous for. The odds on the right are exactly <code>cos²(θ/2)</code> and <code>sin²(θ/2)</code>,
        the same formula used in the "What is a Qubit?" lesson.
      </p>
    </div>
  );
}

function WaveSuperposition() {
  return <QuantumPanel />;
}

export default WaveSuperposition;
