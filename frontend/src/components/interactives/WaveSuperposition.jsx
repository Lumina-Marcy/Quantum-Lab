import { useCallback, useRef, useState } from 'react';

const WAVE_WIDTH = 280;
const WAVE_HEIGHT = 140;
const CYCLES = 2;
const SAMPLES = 120;

function buildWavePath(fn) {
  const points = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * CYCLES * 2 * Math.PI;
    const x = (i / SAMPLES) * WAVE_WIDTH;
    const y = WAVE_HEIGHT / 2 - fn(t) * (WAVE_HEIGHT / 2 - 6);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M ${points.join(' L ')}`;
}

function WaveChart({ freqA, ampA, freqB, ampB }) {
  const waveA = (t) => ampA * Math.sin(freqA * t);
  const waveB = (t) => ampB * Math.sin(freqB * t);
  const sum = (t) => waveA(t) + waveB(t);
  const maxAmp = Math.max(ampA + ampB, 1);

  return (
    <svg
      viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`}
      className="w-full rounded-2xl border border-slate-700 bg-slate-950/70"
    >
      <line x1={0} y1={WAVE_HEIGHT / 2} x2={WAVE_WIDTH} y2={WAVE_HEIGHT / 2} stroke="#334155" strokeWidth="1" />
      <path d={buildWavePath((t) => waveA(t) / maxAmp)} fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.7" />
      <path d={buildWavePath((t) => waveB(t) / maxAmp)} fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.7" />
      <path d={buildWavePath((t) => sum(t) / maxAmp)} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
    </svg>
  );
}

function ClassicalPanel() {
  const [freqA] = useState(1);
  const [ampA, setAmpA] = useState(1);
  const [freqB, setFreqB] = useState(2);
  const [ampB, setAmpB] = useState(0.5);

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-blue-300/80">Classical</p>
      <h3 className="mt-1 text-lg font-semibold text-white">Sound Waves (linear, over time)</h3>
      <p className="mt-2 text-sm text-slate-400">
        A musical note is never just one pure frequency — it's a superposition of a fundamental frequency
        (<span className="text-blue-300">blue</span>, fixed here) plus an overtone (
        <span className="text-purple-300">purple</span>). The <span className="text-cyan-300">cyan</span>{' '}
        line is their sum — the actual sound wave your ear hears.
      </p>

      <div className="mt-4">
        <WaveChart freqA={freqA} ampA={ampA} freqB={freqB} ampB={ampB} />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="flex justify-between text-xs text-slate-400">
            <span>Fundamental volume</span>
            <span>{ampA.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={ampA}
            onChange={(e) => setAmpA(Number(e.target.value))}
            className="w-full accent-blue-400"
          />
        </div>
        <div>
          <label className="flex justify-between text-xs text-slate-400">
            <span>Overtone frequency (× fundamental)</span>
            <span>{freqB}×</span>
          </label>
          <input
            type="range"
            min="1"
            max="6"
            step="1"
            value={freqB}
            onChange={(e) => setFreqB(Number(e.target.value))}
            className="w-full accent-purple-400"
          />
        </div>
        <div>
          <label className="flex justify-between text-xs text-slate-400">
            <span>Overtone volume</span>
            <span>{ampB.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={ampB}
            onChange={(e) => setAmpB(Number(e.target.value))}
            className="w-full accent-purple-400"
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Notice the fundamental pitch never changes — only the overtone does. That's the same idea as a
        violin and a piano playing the same note: identical fundamental frequency, different overtone
        blend, so a different overall wave shape (timbre).
      </p>
    </div>
  );
}

const FIELD_W = 280;
const FIELD_H = 220;
const CENTER = { x: FIELD_W / 2, y: FIELD_H / 2 };
const TILT = (25 * Math.PI) / 180;

function project(x, y, z) {
  return { x, y: -(z * Math.cos(TILT) - y * Math.sin(TILT)) };
}

function toScreen(x, y, z) {
  const p = project(x, y, z);
  return { x: CENTER.x + p.x, y: CENTER.y + p.y };
}

function dist3D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

// x = left/right, y = depth (into screen), z = up/down — same axis convention as BlochSphere.jsx
const DOTS = [
  { x: -42, y: -70, z: 60 }, { x: 8, y: -35, z: 68 }, { x: 58, y: 0, z: 55 }, { x: 97, y: 35, z: 35 },
  { x: -33, y: 70, z: 8 }, { x: 25, y: -70, z: -7 }, { x: 77, y: -35, z: 3 },
  { x: -46, y: 0, z: -42 }, { x: 0, y: 35, z: -55 }, { x: 50, y: 70, z: -47 }, { x: 93, y: -70, z: -60 }, { x: -15, y: -35, z: -25 },
];

const DEFAULT_SOURCE2 = { x: 0, y: 0, z: 0 };
const SOURCE1 = { x: -118, y: 0, z: 0 };

function Ripples({ cx, cy, color, durationSec }) {
  return (
    <>
      {[0, durationSec / 2].map((delay, i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="none" stroke={color} strokeWidth="1.5" opacity="0.7">
          <animate attributeName="r" from="4" to="130" dur={`${durationSec}s`} begin={`${delay}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.7" to="0" dur={`${durationSec}s`} begin={`${delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  );
}

function QuantumPanel() {
  const containerRef = useRef(null);
  const [wavelength, setWavelength] = useState(30);
  const [source2, setSource2] = useState(DEFAULT_SOURCE2);

  const handleMove = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    setSource2({
      x: (fx * 2 - 1) * 118,
      y: 0,
      z: (1 - fy * 2) * 90,
    });
  }, []);

  const handleLeave = useCallback(() => setSource2(DEFAULT_SOURCE2), []);

  const k = (2 * Math.PI) / wavelength;

  const intensities = DOTS.map((dot) => {
    const d1 = dist3D(dot, SOURCE1);
    const d2 = dist3D(dot, source2);
    const re = Math.cos(k * d1) + Math.cos(k * d2);
    const im = Math.sin(k * d1) + Math.sin(k * d2);
    return (re * re + im * im) / 4;
  });

  const winner = intensities.indexOf(Math.max(...intensities));
  const rippleDuration = (wavelength / 15).toFixed(2);
  const source1Screen = toScreen(SOURCE1.x, SOURCE1.y, SOURCE1.z);
  const source2Screen = toScreen(source2.x, source2.y, source2.z);

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Quantum</p>
      <h3 className="mt-1 text-lg font-semibold text-white">A Space of Possible States</h3>
      <p className="mt-2 text-sm text-slate-400">
        Each dot floats at its own depth in a 3D space of possible outcomes. A fixed source (
        <span className="text-amber-300">amber</span>) and a source you control (
        <span className="text-pink-400">pink</span>, move your mouse over the field) both send out
        ripples. Where they add up (constructive interference), a dot lights up brighter — the brightest
        one (pink ring) is the state most likely to be found when you measure.
      </p>

      <div className="mt-4">
        <div ref={containerRef} onMouseMove={handleMove} onMouseLeave={handleLeave} className="cursor-crosshair">
          <svg
            viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70"
          >
            <circle cx={source1Screen.x} cy={source1Screen.y} r="4" fill="#fbbf24" />
            <Ripples cx={source1Screen.x} cy={source1Screen.y} color="#fbbf24" durationSec={Number(rippleDuration)} />

            <circle cx={source2Screen.x} cy={source2Screen.y} r="5" fill="#f472b6" />
            <Ripples cx={source2Screen.x} cy={source2Screen.y} color="#f472b6" durationSec={Number(rippleDuration)} />

            {DOTS.map((dot, i) => {
              const s = toScreen(dot.x, dot.y, dot.z);
              const depthScale = 1 + (-dot.y / 70) * 0.3;
              return (
                <g key={i}>
                  {i === winner && <circle cx={s.x} cy={s.y} r={10 * depthScale} fill="none" stroke="#f472b6" strokeWidth="2" />}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={(3 + 5 * intensities[i]) * depthScale}
                    fill="#22d3ee"
                    opacity={(0.25 + 0.75 * intensities[i]) * Math.min(1, depthScale)}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-2 text-center text-sm text-white">
        Most likely: <span className="font-semibold text-pink-400">State {winner + 1}</span>{' '}
        <span className="text-slate-500">({Math.round(intensities[winner] * 100)}% relative intensity)</span>
      </div>

      <div className="mt-4">
        <label className="flex justify-between text-xs text-slate-400">
          <span>Wavelength</span>
          <span>{wavelength}</span>
        </label>
        <input
          type="range"
          min="15"
          max="60"
          step="1"
          value={wavelength}
          onChange={(e) => setWavelength(Number(e.target.value))}
          className="w-full accent-cyan-400"
        />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        This is the same "weighted sum" idea as the wave on the left, just spread across 3D space instead
        of drawn over time — and instead of one fixed outcome, every dot gets a probability, with one
        state standing out as most likely.
      </p>
    </div>
  );
}

function WaveSuperposition() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ClassicalPanel />
      <QuantumPanel />
    </div>
  );
}

export default WaveSuperposition;
