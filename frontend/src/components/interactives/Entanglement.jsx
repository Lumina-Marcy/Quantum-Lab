import { useState } from 'react';

const TILT = (25 * Math.PI) / 180;
const MINI_SIZE = 110;
const MINI_RADIUS = MINI_SIZE / 2 - 16;
const MIN_QUBITS = 1;
const MAX_QUBITS = 6;
const DEFAULT_ANGLES = { theta: Math.PI / 2, phi: 0 };

function project(x, y, z) {
  return { x, y: -(z * Math.cos(TILT) - y * Math.sin(TILT)) };
}

function toScreen(x, y, z) {
  const p = project(x, y, z);
  return { x: MINI_SIZE / 2 + p.x * MINI_RADIUS, y: MINI_SIZE / 2 + p.y * MINI_RADIUS };
}

function pOneFromTheta(theta) {
  return Math.cos(theta / 2) ** 2;
}

function QubitSphere({ index, angles, onMove }) {
  const { theta, phi } = angles;
  const x3 = Math.sin(theta) * Math.cos(phi);
  const y3 = Math.sin(theta) * Math.sin(phi);
  const z3 = Math.cos(theta);
  const tip = toScreen(x3, y3, z3);
  const center = MINI_SIZE / 2;
  const pOne = pOneFromTheta(theta);
  const axisHalf = MINI_RADIUS * Math.cos(TILT);

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
    onMove(index, { theta: ((dy + 1) / 2) * Math.PI, phi: dx * Math.PI });
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        onMouseMove={handleMove}
        className="relative cursor-crosshair select-none"
        style={{ width: MINI_SIZE, height: MINI_SIZE }}
      >
        <svg viewBox={`0 0 ${MINI_SIZE} ${MINI_SIZE}`} width={MINI_SIZE} height={MINI_SIZE}>
          <circle
            cx={center}
            cy={center}
            r={MINI_RADIUS}
            fill="rgba(34,211,238,0.05)"
            stroke="#334155"
            strokeWidth="1"
          />
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
          <line x1={center} y1={center} x2={tip.x} y2={tip.y} stroke="#22d3ee" strokeWidth="2" />
          <circle cx={tip.x} cy={tip.y} r="3" fill="#67e8f9" />
        </svg>
      </div>
      <span className="text-xs text-slate-400">
        Q{index + 1}: <span className="text-cyan-300">{Math.round(pOne * 100)}%</span>
      </span>
    </div>
  );
}

function computeJoint(anglesList, entangled) {
  const n = anglesList.length;
  const total = 2 ** n;
  const perQubitP1 = anglesList.map((a) => pOneFromTheta(a.theta));

  const results = [];
  for (let i = 0; i < total; i++) {
    const bits = i.toString(2).padStart(n, '0');
    let prob;
    if (entangled) {
      prob = bits === '0'.repeat(n) || bits === '1'.repeat(n) ? 0.5 : 0;
    } else {
      prob = 1;
      for (let q = 0; q < n; q++) {
        const p1 = perQubitP1[q];
        prob *= bits[q] === '1' ? p1 : 1 - p1;
      }
    }
    results.push({ bits, prob });
  }
  return results;
}

function Entanglement() {
  const [count, setCount] = useState(2);
  const [anglesList, setAnglesList] = useState(() => Array(2).fill(null).map(() => ({ ...DEFAULT_ANGLES })));
  const [entangled, setEntangled] = useState(false);

  function setQubitCount(next) {
    const clamped = Math.min(MAX_QUBITS, Math.max(MIN_QUBITS, next));
    setCount(clamped);
    setAnglesList((prev) => {
      const copy = prev.slice(0, clamped);
      while (copy.length < clamped) copy.push({ ...DEFAULT_ANGLES });
      return copy;
    });
  }

  function handleMove(index, angles) {
    setAnglesList((prev) => prev.map((a, i) => (i === index ? angles : a)));
  }

  function resetAll() {
    setAnglesList(Array(count).fill(null).map(() => ({ ...DEFAULT_ANGLES })));
  }

  const distribution = computeJoint(anglesList, entangled);
  const maxProb = Math.max(...distribution.map((d) => d.prob), 0.0001);

  return (
    <div className="space-y-6">
      <p className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
        Each sphere below is its own qubit — move your mouse over one to set its odds of measuring 0 or 1;
        it keeps that setting even after you move on to the next qubit, so you can shape several qubits
        differently and see how they combine. The chart shows the odds of every possible combined outcome
        across all qubits at once. Try the <span className="text-cyan-300">Entangle qubits</span> toggle to
        see a combined outcome that hovering the qubits individually can never produce — that's the whole
        point of entanglement.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Qubits:</span>
          <button
            onClick={() => setQubitCount(count - 1)}
            disabled={count <= MIN_QUBITS}
            className="h-8 w-8 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-400 disabled:opacity-30"
          >
            −
          </button>
          <span className="w-6 text-center font-semibold text-white">{count}</span>
          <button
            onClick={() => setQubitCount(count + 1)}
            disabled={count >= MAX_QUBITS}
            className="h-8 w-8 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-400 disabled:opacity-30"
          >
            +
          </button>
        </div>

        <button
          onClick={() => setEntangled((e) => !e)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            entangled ? 'bg-fuchsia-400 text-slate-950' : 'border border-slate-600 text-slate-300 hover:border-slate-400'
          }`}
        >
          {entangled ? 'Entangled ✓' : 'Entangle qubits'}
        </button>

        <button
          onClick={resetAll}
          className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
        >
          Reset all
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        {anglesList.map((angles, i) => (
          <QubitSphere key={i} index={i} angles={angles} onMove={handleMove} />
        ))}
      </div>

      {entangled && (
        <p className="rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-300">
          With entanglement on, hovering the spheres above no longer matters for the chart below — the
          qubits only ever come up all-0s or all-1s together, 50/50, and nothing in between. No amount of
          individually tweaking each qubit's own odds can reproduce that pattern — it only exists because
          the qubits are linked.
        </p>
      )}

      <div>
        <p className="mb-2 text-center text-sm uppercase tracking-[0.3em] text-cyan-300/80">
          Probability distribution
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
          <div className="flex h-40 items-end gap-1" style={{ width: distribution.length * 32 }}>
            {distribution.map(({ bits, prob }) => (
              <div key={bits} className="flex w-7 shrink-0 flex-col items-center gap-1">
                <span className="text-[9px] text-slate-500">{Math.round(prob * 100)}%</span>
                <div className="flex h-28 w-full items-end rounded bg-slate-900">
                  <div
                    className="w-full rounded bg-emerald-400"
                    style={{ height: `${(prob / maxProb) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-slate-400">{bits}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Entanglement;