import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const TILT = (25 * Math.PI) / 180;
const MINI_SIZE = 110;
const MINI_RADIUS = MINI_SIZE / 2 - 16;
const MIN_QUBITS = 2;
const MAX_QUBITS = 4;
const DEFAULT_ANGLES = { theta: Math.PI / 2, phi: 0 };

const WAVE_WIDTH = 520;
const WAVE_HEIGHT = 80;
const SUM_HEIGHT = 130;
const CYCLES = 2;
const SAMPLES = 160;
const WAVE_SPEED = 0.6;

const QUBIT_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c'];

const STEPS = [
  'Set your qubits',
  'Each qubit is a wavefunction',
  'The waves combine into one',
  'Measure an answer',
];

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

function qubitWaveFn(angles, freq, timeShift = 0) {
  const amplitude = Math.sin(angles.theta);
  return (t) => amplitude * Math.sin(freq * (t - timeShift) + angles.phi);
}

function sumWaveFn(anglesList, timeShift = 0) {
  const waves = anglesList.map((a, i) => qubitWaveFn(a, i + 1, timeShift));
  return (t) => waves.reduce((acc, fn) => acc + fn(t), 0) / anglesList.length;
}

function buildPath(fn, width, height) {
  const points = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * CYCLES * 2 * Math.PI;
    const x = (i / SAMPLES) * width;
    const y = height / 2 - fn(t) * (height / 2 - 6);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M ${points.join(' L ')}`;
}

function computeDistribution(anglesList) {
  const n = anglesList.length;
  const total = 2 ** n;
  const sum = sumWaveFn(anglesList);

  const raw = [];
  for (let k = 0; k < total; k++) {
    const t = ((k + 0.5) / total) * CYCLES * 2 * Math.PI;
    const value = sum(t);
    raw.push({ bits: k.toString(2).padStart(n, '0'), value, weight: value * value });
  }
  const totalWeight = raw.reduce((s, r) => s + r.weight, 0) || 1;
  return raw.map((r) => ({ ...r, prob: r.weight / totalWeight }));
}

function sampleOutcome(distribution) {
  const r = Math.random();
  let acc = 0;
  for (const d of distribution) {
    acc += d.prob;
    if (r <= acc) return d.bits;
  }
  return distribution[distribution.length - 1].bits;
}

function QubitSphere({ index, angles, onMove, color }) {
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
          <line x1={center} y1={center} x2={tip.x} y2={tip.y} stroke={color} strokeWidth="2.5" />
          <circle cx={tip.x} cy={tip.y} r="3" fill={color} />
        </svg>
      </div>
      <span className="text-xs text-slate-400">
        Q{index + 1}: <span style={{ color }}>{Math.round(pOne * 100)}%</span>
      </span>
    </div>
  );
}

function Interference() {
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(3);
  const [anglesList, setAnglesList] = useState(() => Array(3).fill(null).map(() => ({ ...DEFAULT_ANGLES })));
  const [measured, setMeasured] = useState(null);
  const [time, setTime] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (step < 1) return undefined;
    let start = null;
    function tick(now) {
      if (start === null) start = now;
      setTime((now - start) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step >= 1]);

  function setQubitCount(next) {
    const clamped = Math.min(MAX_QUBITS, Math.max(MIN_QUBITS, next));
    setCount(clamped);
    setAnglesList((prev) => {
      const copy = prev.slice(0, clamped);
      while (copy.length < clamped) copy.push({ ...DEFAULT_ANGLES });
      return copy;
    });
    setMeasured(null);
  }

  function handleMove(index, angles) {
    setAnglesList((prev) => prev.map((a, i) => (i === index ? angles : a)));
    setMeasured(null);
  }

  function resetAll() {
    setAnglesList(Array(count).fill(null).map(() => ({ ...DEFAULT_ANGLES })));
    setStep(0);
    setMeasured(null);
  }

  function goNext() {
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    setMeasured(null);
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
    setMeasured(null);
  }

  const distribution = computeDistribution(anglesList);
  const maxProb = Math.max(...distribution.map((d) => d.prob), 0.0001);
  const timeShift = time * WAVE_SPEED;
  const sum = sumWaveFn(anglesList, timeShift);
  const sumPath = buildPath(sum, WAVE_WIDTH, SUM_HEIGHT);

  const explanations = [
    'Every qubit below is really described by a wavefunction, not just an arrow. Hover a sphere to set that qubit\'s state — you can shape each one differently.',
    'Here\'s each qubit turned into its wavefunction. How "wavy" it is depends on how much superposition it\'s in (hover near the equator for the biggest wave, near a pole for almost none); which way it leans left or right depends on its phase (left/right mouse position).',
    'When you have several qubits together, their wavefunctions add up into one overall wavefunction. Where two waves both peak or both dip at the same point, they reinforce — constructive interference, a taller combined wave. Where one peaks while another dips, they cancel out — destructive interference, close to flat.',
    'The overall wavefunction determines the odds of every possible answer: tall points (positive or negative — squaring removes the sign) mean a likely answer, and points near zero mean an unlikely one. But a real measurement only ever gives back one concrete answer, chosen according to those odds — never a blend.',
  ];

  return (
    <div className="space-y-6">
      <p className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
        Quantum algorithms don't just get lucky — they use <span className="text-cyan-300">interference</span> to
        make correct answers more likely and wrong answers less likely, by combining wavefunctions so they
        reinforce (<span className="text-emerald-300">constructive</span>) or cancel
        (<span className="text-rose-300">destructive</span>) each other out. Step through the process below.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4">
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
        <span className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </span>
        <button
          onClick={resetAll}
          className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
        >
          Start over
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        {anglesList.map((angles, i) => (
          <QubitSphere key={i} index={i} angles={angles} onMove={handleMove} color={QUBIT_COLORS[i]} />
        ))}
      </div>

      {step >= 1 && (
        <div className="space-y-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-400">Individual wavefunctions</p>
          {anglesList.map((angles, i) => (
            <svg key={i} viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`} className="w-full">
              <line x1={0} y1={WAVE_HEIGHT / 2} x2={WAVE_WIDTH} y2={WAVE_HEIGHT / 2} stroke="#334155" strokeWidth="1" />
              <motion.path
                d={buildPath(qubitWaveFn(angles, i + 1, timeShift), WAVE_WIDTH, WAVE_HEIGHT)}
                fill="none"
                stroke={QUBIT_COLORS[i]}
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: step >= 2 ? 0.35 : 1 }}
                transition={{ pathLength: { duration: 1, ease: 'easeInOut' }, opacity: { duration: 0.6 } }}
              />
            </svg>
          ))}
        </div>
      )}

      {step >= 2 && (
        <div className="rounded-2xl border border-cyan-500/40 bg-slate-950/70 p-4">
          <p className="mb-2 text-center text-xs uppercase tracking-[0.3em] text-cyan-300/80">
            Overall wavefunction (average of all the qubits above)
          </p>
          <svg viewBox={`0 0 ${WAVE_WIDTH} ${SUM_HEIGHT}`} className="w-full">
            <line x1={0} y1={SUM_HEIGHT / 2} x2={WAVE_WIDTH} y2={SUM_HEIGHT / 2} stroke="#334155" strokeWidth="1" />
            <motion.path
              d={sumPath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      )}

      {step >= 3 && (
        <div>
          <p className="mb-2 text-center text-sm uppercase tracking-[0.3em] text-cyan-300/80">
            Probability distribution
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
            <div className="flex h-40 items-end justify-center gap-1.5" style={{ minWidth: distribution.length * 40 }}>
              {distribution.map(({ bits, prob }) => {
                const isMeasured = measured === bits;
                return (
                  <div key={bits} className="flex w-8 shrink-0 flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-500">{Math.round(prob * 100)}%</span>
                    <div
                      className={`flex h-28 w-full items-end rounded bg-slate-900 ring-2 transition-colors ${
                        isMeasured ? 'ring-cyan-400' : 'ring-transparent'
                      }`}
                    >
                      <motion.div
                        animate={{ height: `${Math.max(2, (prob / maxProb) * 100)}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className={`w-full rounded ${isMeasured ? 'bg-cyan-400' : 'bg-emerald-400'}`}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400">{bits}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setMeasured(sampleOutcome(distribution))}
              className="rounded-full bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Measure!
            </button>
            {measured && (
              <span className="text-sm text-slate-300">
                Measured: <span className="font-mono font-semibold text-cyan-300">{measured}</span>
              </span>
            )}
          </div>
        </div>
      )}

      <p className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm leading-relaxed text-slate-300">
        {explanations[step]}
      </p>

      <div className="flex justify-between">
        <button
          onClick={goBack}
          disabled={step === 0}
          className="rounded-full border border-slate-600 px-5 py-2.5 font-semibold text-slate-300 hover:border-slate-400 disabled:opacity-30"
        >
          ← Back
        </button>
        <button
          onClick={goNext}
          disabled={step === STEPS.length - 1}
          className="rounded-full bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
        >
          Next step →
        </button>
      </div>
    </div>
  );
}

export default Interference;