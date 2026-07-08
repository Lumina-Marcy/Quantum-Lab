import { useCallback, useRef, useState } from 'react';

const TILT = (25 * Math.PI) / 180;
const SIZE = 280;
const RADIUS = SIZE / 2;
const DEFAULT_ANGLES = { theta: Math.PI / 2, phi: 0 };

function project(x, y, z) {
  return {
    x,
    y: -(z * Math.cos(TILT) - y * Math.sin(TILT)),
  };
}

function BlochSphere() {
  const containerRef = useRef(null);
  const [angles, setAngles] = useState(DEFAULT_ANGLES);

  const handleMove = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = (e.clientX - cx) / (rect.width / 2);
    let dy = (e.clientY - cy) / (rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    setAngles({ theta: ((dy + 1) / 2) * Math.PI, phi: dx * Math.PI });
  }, []);

  const handleLeave = useCallback(() => setAngles(DEFAULT_ANGLES), []);

  const { theta, phi } = angles;
  const x3 = Math.sin(theta) * Math.cos(phi);
  const y3 = Math.sin(theta) * Math.sin(phi);
  const z3 = Math.cos(theta);
  const tip = project(x3, y3, z3);
  const tipX = RADIUS + tip.x * RADIUS;
  const tipY = RADIUS + tip.y * RADIUS;

  const pOne = Math.cos(theta / 2) ** 2;
  const pZero = Math.sin(theta / 2) ** 2;
  const likely = pOne >= pZero ? '|1⟩' : '|0⟩';
  const likelyPct = Math.round(Math.max(pOne, pZero) * 100);
  const equatorHeight = 2 * RADIUS * Math.sin(TILT);
  const axisHalf = RADIUS * Math.cos(TILT);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative cursor-crosshair select-none"
        style={{ width: SIZE, height: SIZE }}
      >
        <div
          className="absolute inset-0 rounded-full border border-slate-600/40"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(103,232,249,0.35), rgba(15,23,42,0.9) 70%)',
            boxShadow: 'inset -10px -10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(34,211,238,0.15)',
          }}
        />
        <div
          className="absolute left-0 rounded-full border border-cyan-400/30"
          style={{ top: RADIUS - equatorHeight / 2, width: SIZE, height: equatorHeight }}
        />
        <div
          className="absolute left-1/2 w-px bg-slate-500/40"
          style={{ top: RADIUS - axisHalf, height: axisHalf * 2 }}
        />
        <span
          className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-cyan-200"
          style={{ top: RADIUS - axisHalf - 22 }}
        >
          |1⟩
        </span>
        <span
          className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-cyan-200"
          style={{ top: RADIUS + axisHalf + 6 }}
        >
          |0⟩
        </span>

        <svg className="absolute inset-0" width={SIZE} height={SIZE}>
          <defs>
            <marker id="bloch-arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#22d3ee" />
            </marker>
          </defs>
          <line
            x1={RADIUS}
            y1={RADIUS}
            x2={tipX}
            y2={tipY}
            stroke="#22d3ee"
            strokeWidth="2.5"
            markerEnd="url(#bloch-arrowhead)"
          />
          <circle cx={tipX} cy={tipY} r="4" fill="#67e8f9" />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-400">Move your mouse over the sphere</p>
        <p className="mt-1 text-lg text-white">
          Most likely outcome: <span className="font-semibold text-cyan-300">{likely}</span>{' '}
          <span className="text-slate-400">({likelyPct}%)</span>
        </p>
        <div className="mt-2 flex justify-center gap-4 text-sm text-slate-400">
          <span>P(|1⟩) = {Math.round(pOne * 100)}%</span>
          <span>P(|0⟩) = {Math.round(pZero * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

export default BlochSphere;
