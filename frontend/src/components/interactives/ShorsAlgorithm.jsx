import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_P = 7177;
const DEFAULT_Q = 3001;
const MAX_PRIME_INPUT = 9000;
const MAX_CUSTOM_N = 2000000;
const ORDER_FINDING_CAP = 2000000;
const MAX_ATTEMPTS = 12;
const PLOT_POINTS = 20;

function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function modpow(base, exp, mod) {
  base = base % mod;
  let result = 1;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

function findOrder(a, N, cap) {
  let x = 1;
  for (let r = 1; r <= cap; r++) {
    x = (x * a) % N;
    if (x === 1) return r;
  }
  return null;
}

function smallestFactor(N) {
  if (N % 2 === 0) return 2;
  for (let i = 3; i * i <= N; i += 2) {
    if (N % i === 0) return i;
  }
  return null;
}

function buildSequence(a, r, N) {
  const points = Math.min(r, PLOT_POINTS);
  const seq = [];
  let x = 1;
  seq.push(x);
  for (let i = 1; i <= points; i++) {
    x = (x * a) % N;
    seq.push(x);
  }
  return seq;
}

function traceShor(N) {
  const steps = [];
  if (N % 2 === 0) {
    steps.push({ type: 'even', p: 2, q: N / 2 });
    return steps;
  }
  const cap = Math.min(ORDER_FINDING_CAP, N - 1);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const a = 2 + Math.floor(Math.random() * (N - 3));
    const g = gcd(a, N);
    if (g > 1) {
      steps.push({ type: 'lucky-gcd', attempt, a, g, other: N / g });
      return steps;
    }
    const r = findOrder(a, N, cap);
    if (r == null) {
      steps.push({ type: 'order-cap-exceeded', attempt, a, cap });
      continue;
    }
    if (r % 2 !== 0) {
      steps.push({ type: 'odd-order', attempt, a, r });
      continue;
    }
    const halfPow = modpow(a, r / 2, N);
    if (halfPow === N - 1) {
      steps.push({ type: 'trivial-root', attempt, a, r, halfPow });
      continue;
    }
    const f1 = gcd(halfPow - 1, N);
    const f2 = gcd(halfPow + 1, N);
    const factor = f1 > 1 && f1 < N ? f1 : f2 > 1 && f2 < N ? f2 : null;
    if (factor) {
      steps.push({
        type: 'success',
        attempt,
        a,
        r,
        halfPow,
        p: factor,
        q: N / factor,
        sequence: buildSequence(a, r, N),
      });
      return steps;
    }
    steps.push({ type: 'no-luck', attempt, a, r, halfPow });
  }
  steps.push({ type: 'failed' });
  return steps;
}

function isTerminal(type) {
  return type === 'success' || type === 'lucky-gcd' || type === 'even' || type === 'failed';
}

function failureMessage(step) {
  switch (step.type) {
    case 'order-cap-exceeded':
      return `Attempt ${step.attempt}: guessed a = ${step.a}. Classically, finding the period of a^x mod N by trial-and-error would take more than ${step.cap.toLocaleString()} steps for a number this size — too slow to grind through here. A real quantum computer would find it in one shot regardless. Trying a fresh guess...`;
    case 'odd-order':
      return `Attempt ${step.attempt}: guessed a = ${step.a}, found period r = ${step.r}. That's odd, and the next step needs r to be even, so this guess is a dead end. Trying a fresh guess...`;
    case 'trivial-root':
      return `Attempt ${step.attempt}: guessed a = ${step.a}, found period r = ${step.r}, but a^(r/2) mod N = ${step.halfPow} = N − 1. That's a "trivial" square root that gives no new information. Trying a fresh guess...`;
    case 'no-luck':
      return `Attempt ${step.attempt}: guessed a = ${step.a}, found period r = ${step.r}, but the gcd step landed on a trivial factor. Trying a fresh guess...`;
    default:
      return '';
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function PeriodPlot({ sequence, r, N }) {
  const width = 320;
  const height = 100;
  const step = width / (sequence.length - 1);
  const points = sequence
    .map((v, i) => `${i * step},${height - (v / N) * height}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="2" />
      {sequence.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={height - (v / N) * height}
          r={i === sequence.length - 1 && v === 1 && i > 0 ? 4 : 2.5}
          fill={i === sequence.length - 1 && v === 1 && i > 0 ? '#fbbf24' : '#67e8f9'}
        />
      ))}
      {sequence.length - 1 < r && (
        <text x={width - 4} y={height - 4} fill="#64748b" fontSize="9" textAnchor="end">
          pattern continues for {r - (sequence.length - 1)} more steps…
        </text>
      )}
    </svg>
  );
}

function MultiplicationPanel({ p, q, onUse }) {
  const [pInput, setPInput] = useState(String(p));
  const [qInput, setQInput] = useState(String(q));
  const [error, setError] = useState(null);

  const n = Number(pInput) * Number(qInput);

  function handleUse(e) {
    e.preventDefault();
    const pv = Number(pInput);
    const qv = Number(qInput);
    if (!isPrime(pv) || !isPrime(qv)) {
      setError('Both numbers need to be prime.');
      return;
    }
    if (pv > MAX_PRIME_INPUT || qv > MAX_PRIME_INPUT) {
      setError(`Keep each prime under ${MAX_PRIME_INPUT.toLocaleString()} so the demo stays snappy.`);
      return;
    }
    if (pv === qv) {
      setError('Pick two different primes.');
      return;
    }
    setError(null);
    onUse(pv, qv);
  }

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/80">Multiplication</p>
      <h3 className="mt-1 text-lg font-semibold text-white">Pick two primes</h3>
      <form onSubmit={handleUse} className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Prime p</label>
          <input
            type="number"
            value={pInput}
            onChange={(e) => setPInput(e.target.value)}
            className="w-32 rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <span className="pb-2 text-2xl text-slate-500">×</span>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Prime q</label>
          <input
            type="number"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className="w-32 rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-emerald-300">N = p × q</p>
        <p className="mt-1 text-2xl font-bold text-white">
          {Number.isFinite(n) ? n.toLocaleString() : '—'}
        </p>
        <p className="mt-1 text-xs text-emerald-200/80">Easy: one multiplication, one answer.</p>
      </div>

      <button
        onClick={handleUse}
        className="mt-4 w-full rounded-full bg-emerald-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-emerald-400"
      >
        Send N to Factorisation →
      </button>
    </div>
  );
}

function FactorizationPanel({ N, onNChange, knownFactors }) {
  const [nInput, setNInput] = useState(String(N));
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(null);
  const [foundFactor, setFoundFactor] = useState(null);

  function handleApply(e) {
    e.preventDefault();
    const nv = Number(nInput);
    if (!Number.isInteger(nv) || nv < 4) {
      setError('Enter a whole number of at least 4.');
      return;
    }
    if (nv > MAX_CUSTOM_N) {
      setError(`Keep N under ${MAX_CUSTOM_N.toLocaleString()} so the demo stays snappy.`);
      return;
    }
    if (isPrime(nv)) {
      setError('That number is prime — there is nothing to factor.');
      return;
    }
    setError(null);
    setCount(null);
    setFoundFactor(null);
    onNChange(nv);
  }

  async function runClassicalDemo() {
    setRunning(true);
    setFoundFactor(null);
    const factor = smallestFactor(N);
    const totalSteps = (factor ?? N) - 1;
    const duration = 2200;
    const start = performance.now();

    await new Promise((resolve) => {
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        setCount(Math.round(eased * totalSteps));
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });

    setCount(totalSteps);
    setFoundFactor(factor);
    setRunning(false);
  }

  const inputValue = running || foundFactor !== null ? String(N) : nInput;

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-300/80">Factorisation</p>
      <h3 className="mt-1 text-lg font-semibold text-white">Break N back into its factors</h3>

      <form onSubmit={handleApply} className="mt-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[10rem]">
          <label className="block text-sm text-slate-400 mb-1">N</label>
          <input
            type="number"
            value={inputValue}
            disabled={running}
            onChange={(e) => setNInput(e.target.value)}
            className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2 text-white focus:border-rose-500 focus:outline-none disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={running}
          className="rounded-full bg-rose-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-rose-400 disabled:opacity-50"
        >
          Use this N
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      {knownFactors && (
        <p className="mt-2 text-xs text-slate-500">
          (You built this N from {knownFactors.p.toLocaleString()} × {knownFactors.q.toLocaleString()} —
          but pretend you don't know that. That's exactly the position a classical computer is in.)
        </p>
      )}

      <button
        onClick={runClassicalDemo}
        disabled={running}
        className="mt-4 w-full rounded-full border border-rose-400/50 px-5 py-2.5 font-semibold text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
      >
        {running ? 'Guessing candidate divisors…' : 'Try it the classical way'}
      </button>

      {count !== null && (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-rose-300">Candidates checked</p>
          <p className="mt-1 text-2xl font-bold text-white">{count.toLocaleString()}</p>
          {foundFactor !== null && (
            <p className="mt-1 text-xs text-rose-200/80">
              {foundFactor.toLocaleString()} finally divides evenly — that took checking {count.toLocaleString()}{' '}
              candidates one at a time. Hard!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ShorPanel({ N }) {
  const [trace, setTrace] = useState(null);
  const [attemptIdx, setAttemptIdx] = useState(-1);
  const [subPhase, setSubPhase] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const currentStep = trace && attemptIdx >= 0 ? trace[attemptIdx] : null;
  const done = trace && attemptIdx === trace.length - 1 && isTerminal(currentStep?.type) &&
    (currentStep?.type !== 'success' || subPhase === 'factors');

  function handleRun() {
    const newTrace = traceShor(N);
    setTrace(newTrace);
    setAttemptIdx(-1);
    setSubPhase(null);
    setMessage(
      `Ready to factor N = ${N.toLocaleString()}. A quantum computer starts the same way a classical one would: pick a random guess a, and check gcd(a, N). Click "Next step" to make the first guess.`
    );
  }

  async function handleNext() {
    if (!trace || busy) return;
    setBusy(true);

    const nextIdx = attemptIdx + 1;
    const step = trace[nextIdx];

    if (currentStep && currentStep.type === 'success' && subPhase === 'period') {
      // second click on the final attempt: reveal factors
      setSubPhase('factors');
      setMessage(
        `Classical finish: compute a^(r/2) mod N = ${currentStep.halfPow.toLocaleString()}. Since it's not just ±1, gcd(a^(r/2) − 1, N) and gcd(a^(r/2) + 1, N) reveal genuine factors: ${currentStep.p.toLocaleString()} and ${currentStep.q.toLocaleString()}. Check it: ${currentStep.p.toLocaleString()} × ${currentStep.q.toLocaleString()} = ${(
          currentStep.p * currentStep.q
        ).toLocaleString()}. This is why encryption schemes like RSA rely on factoring being hard — a large enough quantum computer running this same routine breaks them.`
      );
      setBusy(false);
      return;
    }

    if (!step) {
      setBusy(false);
      return;
    }

    setAttemptIdx(nextIdx);

    if (step.type === 'even') {
      setSubPhase('factors');
      setMessage(
        `N is even, so 2 is already a factor: N = 2 × ${step.q.toLocaleString()}. No quantum computer needed for this one — real RSA-style moduli are always odd so this shortcut never applies to them.`
      );
      setBusy(false);
      return;
    }

    if (step.type === 'lucky-gcd') {
      setSubPhase('factors');
      setMessage(
        `Attempt ${step.attempt}: guessed a = ${step.a.toLocaleString()}. Got lucky — gcd(a, N) = ${step.g.toLocaleString()}, which already divides N. Factors: ${step.g.toLocaleString()} and ${step.other.toLocaleString()}. This happens rarely; usually we need the quantum period-finding step below.`
      );
      setBusy(false);
      return;
    }

    if (step.type === 'success') {
      setSubPhase('period');
      setMessage(
        `Attempt ${step.attempt}: guessed a = ${step.a.toLocaleString()}. gcd(a, N) = 1, so no shortcut — on to the quantum step. A real quantum computer puts every value of x into superposition at once, computes a^x mod N for all of them simultaneously, and uses the Quantum Fourier Transform to read off the period directly: r = ${step.r.toLocaleString()}. The plot below shows a^x mod N repeating every r steps — classically you'd have to compute one x at a time to notice that pattern.`
      );
      setBusy(false);
      return;
    }

    if (step.type === 'failed') {
      setMessage(
        `No luck in ${MAX_ATTEMPTS} attempts for N = ${N.toLocaleString()} — unusual, but possible. Try clicking "Run again" for a fresh set of random guesses, or pick a different N.`
      );
      setBusy(false);
      return;
    }

    // failed attempt: show message, then auto-advance after a beat so the log keeps moving
    setMessage(failureMessage(step));
    await sleep(1400);
    setBusy(false);
  }

  return (
    <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">Shor's Algorithm</p>
      <h3 className="mt-1 text-lg font-semibold text-white">Factor N = {N.toLocaleString()} on a quantum computer</h3>
      <p className="mt-2 text-sm text-slate-400">
        Shor's algorithm turns factoring into a period-finding problem, then hands the hard part — finding
        that period — to a quantum computer. Run it below and step through what happens.
      </p>

      <button
        onClick={handleRun}
        className="mt-4 rounded-full bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400"
      >
        {trace ? 'Run again' : "Run Shor's Algorithm"}
      </button>

      {trace && (
        <>
          <div className="mt-6 space-y-2">
            <AnimatePresence>
              {trace.slice(0, attemptIdx + 1).map((step, i) => {
                if (i === attemptIdx) return null; // current step shown in the detail card below
                return (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="text-xs text-slate-500"
                  >
                    {isTerminal(step.type) ? '' : failureMessage(step)}
                  </motion.p>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="mt-2 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              {attemptIdx === -1
                ? 'Not started yet.'
                : `Attempt ${currentStep.attempt ?? 1} of up to ${MAX_ATTEMPTS}`}
            </p>
            <button
              onClick={handleNext}
              disabled={busy || done}
              className={`rounded-full px-5 py-2.5 font-semibold text-slate-950 disabled:opacity-50 ${
                done ? 'bg-emerald-400' : 'bg-cyan-500 hover:bg-cyan-400'
              }`}
            >
              {done ? 'Done!' : busy ? 'Working…' : 'Next step →'}
            </button>
          </div>

          {currentStep && currentStep.type === 'success' && subPhase && (
            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-wide text-cyan-300">a^x mod N, for x = 0…{Math.min(currentStep.r, PLOT_POINTS)}</p>
              <PeriodPlot sequence={currentStep.sequence} r={currentStep.r} N={N} />
              <p className="mt-2 text-xs text-slate-500">
                Period found: r = {currentStep.r.toLocaleString()}
              </p>
            </div>
          )}

          {currentStep && (currentStep.type === 'even' || currentStep.type === 'lucky-gcd' || currentStep.type === 'success') && subPhase === 'factors' && (
            <div className="mt-4 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-emerald-300">Factors found</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {currentStep.p.toLocaleString()} × {currentStep.q.toLocaleString()}
              </p>
            </div>
          )}

          {message && (
            <p className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm leading-relaxed text-slate-300">
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ShorsAlgorithm() {
  const [p, setP] = useState(DEFAULT_P);
  const [q, setQ] = useState(DEFAULT_Q);
  const [n, setN] = useState(DEFAULT_P * DEFAULT_Q);
  const [knownFactors, setKnownFactors] = useState({ p: DEFAULT_P, q: DEFAULT_Q });

  function handleUseFromMultiplication(pv, qv) {
    setP(pv);
    setQ(qv);
    setN(pv * qv);
    setKnownFactors({ p: pv, q: qv });
  }

  function handleNChange(nv) {
    setN(nv);
    setKnownFactors(null);
  }

  return (
    <div className="space-y-6">
      <p className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
        Multiplying two primes together is easy — there's only one answer. Going the other way, splitting
        a big number back into its prime factors, has no efficient classical shortcut: you're stuck
        guessing candidates. That gap is what modern encryption is built on. Shor's algorithm shows how a
        quantum computer closes that gap.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <MultiplicationPanel p={p} q={q} onUse={handleUseFromMultiplication} />
        <FactorizationPanel key={n} N={n} onNChange={handleNChange} knownFactors={knownFactors} />
      </div>

      <ShorPanel key={n} N={n} />
    </div>
  );
}

export default ShorsAlgorithm;
