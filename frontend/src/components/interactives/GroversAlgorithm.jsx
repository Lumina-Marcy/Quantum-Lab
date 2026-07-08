import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const MIN_N = 2;
const MAX_N = 16;
const ANIMATION_MS = 1100;

function uniformAmplitudes(n) {
  return Array(n).fill(1 / Math.sqrt(n));
}

function applyOracle(amplitudes, targetIndex) {
  return amplitudes.map((a, i) => (i === targetIndex ? -a : a));
}

function applyDiffusion(amplitudes) {
  const mean = amplitudes.reduce((sum, a) => sum + a, 0) / amplitudes.length;
  return amplitudes.map((a) => 2 * mean - a);
}

function optimalIterations(n) {
  return Math.max(1, Math.round((Math.PI / 4) * Math.sqrt(n) - 0.5));
}

function fmt(x) {
  return x.toFixed(2);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function GroversAlgorithm() {
  const [n, setN] = useState(8);
  const [target, setTarget] = useState(5);
  const [amplitudes, setAmplitudes] = useState(() => uniformAmplitudes(8));
  const [subSteps, setSubSteps] = useState(0);
  const [message, setMessage] = useState(
    "Every Grover iteration is two moves, always in this order: Oracle, then Diffusion. Click \"Next step\" to walk through the first move."
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [scanIndex, setScanIndex] = useState(null);
  const [scanFound, setScanFound] = useState(false);
  const [diffusionPhase, setDiffusionPhase] = useState(null);

  const targetIndex = target - 1;
  const iteration = Math.floor(subSteps / 2);
  const nextAction = subSteps % 2 === 0 ? 'oracle' : 'diffusion';
  const optimal = useMemo(() => optimalIterations(n), [n]);
  const targetProbability = amplitudes[targetIndex] ** 2;
  const isFinalRecommendedStep = nextAction === 'diffusion' && iteration + 1 === optimal;
  const atOptimal = subSteps > 0 && subSteps % 2 === 0 && iteration === optimal;

  function handleSetup(e) {
    e.preventDefault();
    const clampedN = Math.min(MAX_N, Math.max(MIN_N, Math.round(n)));
    const clampedTarget = Math.min(clampedN, Math.max(1, Math.round(target)));
    setN(clampedN);
    setTarget(clampedTarget);
    setAmplitudes(uniformAmplitudes(clampedN));
    setSubSteps(0);
    setIsAnimating(false);
    setScanIndex(null);
    setScanFound(false);
    setDiffusionPhase(null);
    setMessage(
      `List is reset — all ${clampedN} numbers start with the exact same amplitude, ${fmt(
        1 / Math.sqrt(clampedN)
      )}, so measuring the list right now would return any of them with equal odds. Click "Next step" to apply the Oracle.`
    );
  }

  async function runOracleStep(prev) {
    const steps = targetIndex + 1;
    const perItemMs = Math.max(70, Math.min(220, Math.round(900 / steps)));

    for (let i = 0; i < steps; i++) {
      setScanIndex(i);
      const isMatch = i === targetIndex;
      setScanFound(isMatch);
      setMessage(
        isMatch
          ? `Checking number ${i + 1}... that's a match! In a classical search this is where we'd stop.`
          : `Checking number ${i + 1}... not the one we want, keep going.`
      );
      await sleep(isMatch ? perItemMs * 2 : perItemMs);
    }

    const next = applyOracle(prev, targetIndex);
    setAmplitudes(next);
    setMessage(
      `Oracle move: it flips the sign of ${target}'s amplitude, from ${fmt(prev[targetIndex])} to ${fmt(
        next[targetIndex]
      )}. Watch the bar height (the probability) — it hasn't moved, because squaring a negative number gives the same result as squaring a positive one. All the Oracle does is quietly "mark" ${target} as negative so the next move can tell it apart from the rest. (A real quantum oracle checks every number at once, in superposition — this scan is slowed down just so you can watch it happen.)`
    );
    await sleep(ANIMATION_MS);
    setScanIndex(null);
    setScanFound(false);
  }

  async function runDiffusionStep(prev) {
    const mean = prev.reduce((sum, a) => sum + a, 0) / prev.length;

    setDiffusionPhase('averaging');
    setMessage(
      `Diffusion, part 1: average every amplitude in the list — all at once, not one at a time like the Oracle. Right now that average works out to ${fmt(
        mean
      )}.`
    );
    await sleep(900);

    setDiffusionPhase('reflecting');
    setMessage(
      `Diffusion, part 2: reflect every amplitude across that average at the same time (new = 2 × average − old). Watch all the bars move together.`
    );
    await sleep(500);

    const next = applyDiffusion(prev);
    setAmplitudes(next);
    setMessage(
      `Diffusion move complete: ${target}'s amplitude was ${fmt(
        prev[targetIndex]
      )}, below the average (${fmt(mean)}), so its reflection lands far on the other side at ${fmt(
        next[targetIndex]
      )}. Every other number was above the average, so this same reflection pulls them down instead.`
    );
    await sleep(ANIMATION_MS);
    setDiffusionPhase(null);
  }

  async function handleNextStep() {
    if (isAnimating) return;
    setIsAnimating(true);
    const prev = amplitudes;

    if (nextAction === 'oracle') {
      await runOracleStep(prev);
    } else {
      await runDiffusionStep(prev);
    }

    setSubSteps((s) => s + 1);
    setIsAnimating(false);
  }

  const moveNumber = (subSteps % 2) + 1;
  const diffusionStatusLabel =
    diffusionPhase === 'averaging'
      ? 'Averaging every number at once…'
      : diffusionPhase === 'reflecting'
      ? 'Reflecting every number across the average…'
      : null;

  return (
    <div className="space-y-6">
      <p className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
        Grover's algorithm searches an unsorted list faster than a classical computer by repeating two
        moves — <span className="text-cyan-300">Oracle</span> and{' '}
        <span className="text-cyan-300">Diffusion</span> — enough times to swing the probability of the
        number you want toward 100%. Set up a list below, then step through each move one at a time.
      </p>

      <form onSubmit={handleSetup} className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">How many numbers in the list?</label>
          <input
            type="number"
            min={MIN_N}
            max={MAX_N}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-28 rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Which number should Grover find?</label>
          <input
            type="number"
            min={1}
            max={n}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-28 rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Set up list
        </button>
      </form>

      {diffusionStatusLabel && (
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-violet-300">
          {diffusionStatusLabel}
        </p>
      )}

      <div className="flex h-48 items-end justify-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        {amplitudes.map((a, i) => {
          const isTarget = i === targetIndex;
          const prob = a ** 2;
          const isScanning = scanIndex === i;
          const isScanMatch = isScanning && scanFound;
          const ringClass = isScanMatch
            ? 'ring-rose-400'
            : isScanning
            ? 'ring-yellow-400'
            : diffusionPhase === 'averaging'
            ? 'ring-yellow-400'
            : diffusionPhase === 'reflecting'
            ? 'ring-violet-400'
            : 'ring-transparent';
          return (
            <div key={i} className="flex flex-1 max-w-12 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">
                {a < 0 ? '−' : '+'}
                {Math.round(prob * 100)}%
              </span>
              <div
                className={`flex h-32 w-full items-end overflow-visible rounded bg-slate-900 ring-2 transition-colors ${ringClass}`}
              >
                <motion.div
                  animate={{ height: `${Math.min(100, prob * 100)}%` }}
                  transition={{ duration: ANIMATION_MS / 1000, ease: 'easeInOut', delay: i * 0.03 }}
                  className={`w-full rounded ${isTarget ? 'bg-cyan-400' : 'bg-slate-600'} ${
                    a < 0 ? 'opacity-50' : ''
                  }`}
                />
              </div>
              <span className={`text-xs ${isTarget ? 'font-bold text-cyan-300' : 'text-slate-400'}`}>
                {i + 1}
              </span>
              {isScanning && (
                <span className={`text-[10px] font-semibold ${isScanMatch ? 'text-rose-400' : 'text-yellow-400'}`}>
                  {isScanMatch ? 'match!' : 'checking…'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            Iteration <span className="text-white">{iteration}</span> · move{' '}
            <span className="text-white">{moveNumber}</span> of 2 · optimal for this list size is about{' '}
            <span className="text-white">{optimal}</span> iterations
          </p>
          <p className="mt-1 text-lg text-white">
            P(measure {target}) ={' '}
            <span className="font-semibold text-cyan-300">{Math.round(targetProbability * 100)}%</span>
          </p>
        </div>
        <button
          onClick={handleNextStep}
          disabled={isAnimating}
          className={`rounded-full px-5 py-2.5 font-semibold text-slate-950 disabled:opacity-50 ${
            isFinalRecommendedStep ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-cyan-500 hover:bg-cyan-400'
          }`}
        >
          {isAnimating
            ? 'Applying…'
            : `Next step: Apply ${nextAction === 'oracle' ? 'Oracle' : 'Diffusion'} →${
                isFinalRecommendedStep ? ' (final step!)' : ''
              }`}
        </button>
      </div>

      {atOptimal && (
        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          🎯 You've reached the optimal number of iterations for a list of {n}. The probability of
          measuring {target} is about as high as Grover's algorithm can get it here — this is where you'd
          stop and measure. Keep clicking if you're curious what happens next: since Grover's is periodic,
          more iterations will make the probability fall back down before it rises again.
        </div>
      )}

      <p className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm leading-relaxed text-slate-300">
        {message}
      </p>
    </div>
  );
}

export default GroversAlgorithm;
