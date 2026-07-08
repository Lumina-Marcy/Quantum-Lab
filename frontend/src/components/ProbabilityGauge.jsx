import { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';

const SIZE = 140;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular gauge that animates its fill and label whenever `value` changes. */
function ProbabilityGauge({ value = 0, label = 'Probability of Correct Answer' }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(display, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: setDisplay,
    });
    return () => controls.stop();
    // Only re-run when the target value changes, not on every local `display` update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const offset = CIRCUMFERENCE - (display / 100) * CIRCUMFERENCE;
  const tier = display >= 90 ? 'Very High' : display >= 60 ? 'High' : display >= 30 ? 'Rising' : 'Starting';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="#1e293b" strokeWidth={STROKE} fill="none" />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="url(#gaugeGradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{Math.round(display)}%</span>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-emerald-400">{tier}</span>
        </div>
      </div>
      <p className="mt-3 max-w-[10rem] text-center text-xs text-slate-400">{label}</p>
    </div>
  );
}

export default ProbabilityGauge;
