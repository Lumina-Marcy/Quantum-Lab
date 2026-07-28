import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuantumCore from '../QuantumCore';

const MIN_FACTOR = 2;
const MAX_FACTOR = 9999;
const TICK_MS = 60;
const SEARCH_DURATION_MS = 3600;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(value) || min));
}

// Every divisor pair a quantum-agnostic trial-division search would find, in the order
// it would find them (ascending). This is the "ground truth" the search animation reveals
// candidate-by-candidate — computed instantly since it's the UI, not the thing being timed.
function findFactorPairs(n) {
  const pairs = [];
  const limit = Math.floor(Math.sqrt(n));
  for (let d = 2; d <= limit; d++) {
    if (n % d === 0) pairs.push([d, n / d]);
  }
  return pairs;
}

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

function ShorsAlgorithm() {
  const [factorA, setFactorA] = useState(7177);
  const [factorB, setFactorB] = useState(3001);
  const [committedA, setCommittedA] = useState(7177);
  const [committedB, setCommittedB] = useState(3001);

  const product = committedA * committedB;
  const sqrtProduct = Math.floor(Math.sqrt(product));
  const allPairs = useMemo(() => findFactorPairs(product), [product]);

  const [checked, setChecked] = useState(1);
  const [revealedPairs, setRevealedPairs] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'searching' | 'done' | 'quantum'
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function handleSetNumbers(e) {
    e.preventDefault();
    const a = clamp(factorA, MIN_FACTOR, MAX_FACTOR);
    const b = clamp(factorB, MIN_FACTOR, MAX_FACTOR);
    setFactorA(a);
    setFactorB(b);
    setCommittedA(a);
    setCommittedB(b);
    clearInterval(intervalRef.current);
    setChecked(1);
    setRevealedPairs([]);
    setStatus('idle');
  }

  function startClassicalSearch() {
    clearInterval(intervalRef.current);
    setChecked(1);
    setRevealedPairs([]);
    setStatus('searching');

    const limit = Math.max(1, sqrtProduct - 1);
    const ticks = Math.max(1, Math.round(SEARCH_DURATION_MS / TICK_MS));
    const step = Math.max(1, Math.ceil(limit / ticks));

    intervalRef.current = setInterval(() => {
      setChecked((prev) => {
        const next = Math.min(sqrtProduct, prev + step);
        const newlyFound = allPairs.filter(([d]) => d > prev && d <= next);
        if (newlyFound.length) {
          setRevealedPairs((existing) => [...existing, ...newlyFound]);
        }
        if (next >= sqrtProduct) {
          clearInterval(intervalRef.current);
          setStatus('done');
        }
        return next;
      });
    }, TICK_MS);
  }

  function runQuantumSearch() {
    clearInterval(intervalRef.current);
    setChecked(sqrtProduct);
    setRevealedPairs(allPairs);
    setStatus('quantum');
  }

  const isSearching = status === 'searching';
  const isFinished = status === 'done' || status === 'quantum';
  const progressPct = Math.min(100, Math.round((checked / Math.max(1, sqrtProduct)) * 100));

  return (
    <div className="space-y-6">
      <p className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
        Multiplying two numbers together has exactly <span className="text-cyan-300">one answer</span>, computed
        directly. Going the other way — starting from the result and asking "what was multiplied to get this?" —
        has no shortcut: a classical computer has to guess candidate divisors <span className="text-cyan-300">one
        at a time</span> until one fits. That gap between "easy forward, hard backward" is the entire lock RSA
        encryption is built on.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Multiplication — the easy direction */}
        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/80">Multiplication</p>
          <p className="mt-1 text-sm text-slate-400">The easy direction — one answer, instantly.</p>

          <form onSubmit={handleSetNumbers} className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Number A</label>
              <input
                type="number"
                min={MIN_FACTOR}
                max={MAX_FACTOR}
                value={factorA}
                onChange={(e) => setFactorA(Number(e.target.value))}
                className="w-24 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <span className="pb-2 text-slate-500">×</span>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Number B</label>
              <input
                type="number"
                min={MIN_FACTOR}
                max={MAX_FACTOR}
                value={factorB}
                onChange={(e) => setFactorB(Number(e.target.value))}
                className="w-24 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Multiply
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-cyan-400/70">Result — the only answer</p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">
              {formatNumber(committedA)} × {formatNumber(committedB)} = {formatNumber(product)}
            </p>
          </div>
        </div>

        {/* Factorization — the hard direction */}
        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-400/80">Factorization</p>
          <p className="mt-1 text-sm text-slate-400">The hard direction — guess divisors one at a time.</p>

          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-500">What was multiplied to get…</p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">{formatNumber(product)}</p>
            <p className="mt-1 text-[11px] text-slate-500">?</p>
          </div>

          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className="h-full bg-fuchsia-500"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs text-slate-500">
              {isSearching || isFinished
                ? `Checked ${formatNumber(checked)} of ${formatNumber(sqrtProduct)} possible divisors`
                : 'Not started yet'}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={startClassicalSearch}
              disabled={isSearching}
              className="flex-1 rounded-full bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {isSearching ? 'Searching…' : '🔍 Search classically'}
            </button>
            <button
              onClick={runQuantumSearch}
              disabled={isSearching}
              className="flex-1 rounded-full bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 hover:bg-violet-400 disabled:opacity-50"
            >
              ⚡ Run Shor's Algorithm
            </button>
          </div>

          <div className="mt-4 min-h-16">
            {revealedPairs.length > 0 ? (
              <>
                <p className="text-[11px] uppercase tracking-widest text-slate-500">
                  {status === 'quantum' ? 'Factor pair(s) found instantly' : 'Factor pair(s) found so far'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <AnimatePresence>
                    {revealedPairs.map(([d, other]) => (
                      <motion.span
                        key={d}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-full border border-fuchsia-500/50 bg-fuchsia-950/40 px-3 py-1 font-mono text-xs text-fuchsia-200"
                      >
                        {formatNumber(d)} × {formatNumber(other)}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-slate-600">No factor pairs found yet — start a search above.</p>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-5 ${
              status === 'quantum'
                ? 'border-violet-500/50 bg-violet-950/20'
                : 'border-emerald-500/50 bg-emerald-950/20'
            }`}
          >
            {status === 'quantum' ? (
              <div className="flex items-start gap-3">
                <QuantumCore stage="alive" className="h-9 w-9 flex-shrink-0" particleCount={6} detail="minimal" />
                <p className="text-sm leading-relaxed text-slate-200">
                  <span className="font-semibold text-violet-300">Shor's algorithm found it immediately</span> —
                  it didn't guess divisors one at a time at all. Using quantum superposition, it finds the
                  <em> period</em> of a related function in one shot, and that period hands back the factors
                  directly. The classical search's runtime explodes as the number gets more digits; Shor's
                  runtime barely grows at all. That asymmetry is exactly why {formatNumber(product)} — and every
                  RSA key built the same way — falls to a large enough quantum computer.
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-200">
                Found it — but only after checking {formatNumber(sqrtProduct)} candidate divisors one at a time.
                Notice multiplication only ever gave you <span className="text-cyan-300">one</span> answer to one
                question, while cracking it back open meant <span className="text-fuchsia-300">searching</span>{' '}
                through a whole range of candidates. This toy example finishes in seconds because the numbers are
                small — a real RSA key uses two primes over 150 digits long each. Trial division on a number that
                size would take longer than the universe has existed. Try bigger numbers above and watch the
                progress bar take longer to fill.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm leading-relaxed text-slate-300">
        <span className="font-semibold text-white">Why this threatens encryption today: </span>
        RSA encryption locks your data behind a huge number that's the product of two secret primes — secure only
        because no classical computer can factor it back apart in a useful amount of time. A quantum computer
        running <span className="text-violet-300">Shor's algorithm</span> doesn't get a small speed boost like
        Grover's search does — it changes the problem from "impossibly slow" to "fast," collapsing what would take
        longer than the age of the universe down to hours. That's why the push toward post-quantum, quantum-resistant
        encryption exists: the moment a quantum computer is large enough to run Shor's algorithm on real key sizes,
        today's RSA-protected data stops being safe.
      </p>
    </div>
  );
}

export default ShorsAlgorithm;
