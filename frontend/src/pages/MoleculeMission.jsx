import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QuantumCore from '../components/QuantumCore';
import { jitter } from '../utils/deterministicRandom';

const ELEMENT_COUNT = 4; // Carbon, Hydrogen, Nitrogen, Oxygen
const MAX_PER_ELEMENT = 49;
const VALUES_PER_ELEMENT = MAX_PER_ELEMENT + 1;
const TOTAL_COMBINATIONS = VALUES_PER_ELEMENT ** ELEMENT_COUNT;

// The one true cure is a fixed formula with a guaranteed high score — every other combination is
// scored by a deterministic pseudo-random hash, spread low enough (5%-60%) that stumbling onto
// something above that range by hand practically never happens. That asymmetry is the whole point:
// millions of "meh" results and exactly one needle worth finding.
const CURE = { c: 17, h: 21, n: 3, o: 4 };
const CURE_SCORE = 0.97;
const CURE_NAME = 'Compound QL-7';

const INTRO_LINES = [
  { id: 1, delay: 400, text: '> New pathogen detected — every existing treatment on file is ineffective...', cls: 'text-orange-400' },
  { id: 2, delay: 1500, text: '> Cross-referencing molecular database...', cls: 'text-green-400' },
  {
    id: 3,
    delay: 2700,
    text: `> ${TOTAL_COMBINATIONS.toLocaleString()} possible arrangements of Carbon, Hydrogen, Nitrogen, and Oxygen identified`,
    cls: 'text-yellow-300',
  },
  { id: 4, delay: 3900, text: '> Classical lab synthesis rate: roughly one compound every few seconds...', cls: 'text-green-400' },
  { id: 5, delay: 5100, text: '> Estimated time to test every combination by hand: centuries', cls: 'text-orange-400' },
  { id: 6, delay: 6300, text: '█████████ RESEARCH TEAM ASSEMBLED — SYNTHESIS LAB ONLINE █████████', cls: 'text-emerald-400 font-bold tracking-wider' },
];

function isCure(c, h, n, o) {
  return c === CURE.c && h === CURE.h && n === CURE.n && o === CURE.o;
}

// Every non-cure formula gets a deterministic score in [0.04, 0.60) from a hashed seed — stable
// across renders/replays (same idiom as QuantumCore.jsx's `jitter`-based layouts), so testing the
// same formula twice always reports the same result.
function scoreFor(c, h, n, o) {
  if (isCure(c, h, n, o)) return CURE_SCORE;
  const seed = c * 7919 + h * 104729 + n * 1299709 + o * 15485867 + 11;
  return 0.04 + jitter(seed) * 0.56;
}

function formatFormula(c, h, n, o) {
  const parts = [];
  if (c) parts.push(`C${c > 1 ? c : ''}`);
  if (h) parts.push(`H${h > 1 ? h : ''}`);
  if (n) parts.push(`N${n > 1 ? n : ''}`);
  if (o) parts.push(`O${o > 1 ? o : ''}`);
  return parts.join('') || '—';
}

function formulaKey(c, h, n, o) {
  return `${c}-${h}-${n}-${o}`;
}

function verdictFor(score) {
  if (score >= 0.9) return { label: 'Breakthrough!', cls: 'text-emerald-400' };
  if (score >= 0.6) return { label: 'Promising activity', cls: 'text-cyan-300' };
  if (score >= 0.35) return { label: 'Weak effect', cls: 'text-amber-400' };
  return { label: 'No therapeutic effect', cls: 'text-slate-500' };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Grover's-style amplitude amplification, reused from the Quantum Gates/Grover's lesson
// language on purpose (same oracle-then-diffusion mechanic, same visual grammar) so this reads as
// the same underlying algorithm applied to a new domain, not a new trick. ---
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

const CANDIDATE_SLOTS = 10;

function buildCandidates(tried) {
  const seen = new Set();
  const candidates = [];

  function tryAdd(c, h, n, o) {
    const key = formulaKey(c, h, n, o);
    if (seen.has(key)) return false;
    seen.add(key);
    candidates.push({ c, h, n, o, score: scoreFor(c, h, n, o), formula: formatFormula(c, h, n, o) });
    return true;
  }

  // The player's own attempts always make the cut first — the reveal should feel like it's
  // searching among the compounds they actually explored, not a totally unrelated set.
  for (const m of tried) {
    if (candidates.length >= CANDIDATE_SLOTS - 1) break;
    tryAdd(m.c, m.h, m.n, m.o);
  }

  tryAdd(CURE.c, CURE.h, CURE.n, CURE.o);

  let fillerSeed = 1;
  while (candidates.length < CANDIDATE_SLOTS) {
    const c = Math.floor(jitter(fillerSeed * 3.1 + 1) * VALUES_PER_ELEMENT);
    const h = Math.floor(jitter(fillerSeed * 3.1 + 2) * VALUES_PER_ELEMENT);
    const n = Math.floor(jitter(fillerSeed * 3.1 + 3) * VALUES_PER_ELEMENT);
    const o = Math.floor(jitter(fillerSeed * 3.1 + 4) * VALUES_PER_ELEMENT);
    tryAdd(c, h, n, o);
    fillerSeed += 1;
  }

  return candidates;
}

const SLOT_COUNT = 6;
const MIN_TESTS_BEFORE_QUANTUM = 3;
const COLLECT_POP_MS = 300; // how long an atom's "pop into the flask" animation plays before it respawns

const ELEMENT_KEYS = ['c', 'h', 'n', 'o'];
const ELEMENT_META = {
  c: { symbol: 'C', name: 'Carbon', color: '#94a3b8' },
  h: { symbol: 'H', name: 'Hydrogen', color: '#60a5fa' },
  n: { symbol: 'N', name: 'Nitrogen', color: '#34d399' },
  o: { symbol: 'O', name: 'Oxygen', color: '#f87171' },
};
const EMPTY_COUNTS = { c: 0, h: 0, n: 0, o: 0 };

// A first-timer's first three manual tests get an escalating nudge from a "lab assistant" — by the
// third, testing one candidate at a time has clearly gone nowhere fast, which is exactly the moment
// to point at the Quantum AI CTA (it appears at the same MIN_TESTS_BEFORE_QUANTUM threshold below).
const GUIDE_MESSAGES = {
  1: "That's one molecule tested — but there are 6,250,000 possible arrangements. Testing them this way, one at a time, burns real lab time and resources.",
  2: 'Still no cure, and that\'s two tests down already. At this rate, checking every possibility by hand could take centuries.',
  3: 'This is exactly the kind of problem quantum computing solves. Ready to try the Quantum AI search instead?',
};

// Sits beside the tank at `sm`+ (tail points left, back at the tank) and stacks below it on
// narrow screens where there's no room to the side (tail points up instead).
function GuideBubble({ message }) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl border border-indigo-400/40 bg-indigo-950/70 px-4 py-2.5 text-xs leading-snug text-indigo-100 shadow-lg sm:text-sm"
        >
          <span className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-indigo-400/40 bg-indigo-950 sm:hidden" />
          <span className="absolute -left-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-indigo-400/40 bg-indigo-950 sm:block" />
          <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-indigo-300 sm:text-xs">🔬 Lab Assistant</span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Deterministic per-atom element pick from an ever-incrementing spawn id (same `jitter`-based
// idiom used throughout this codebase for "looks random, isn't Math.random()" layouts) — every
// atom that's ever floated by is reproducible from its spawn id alone.
function generateAtom(spawnId) {
  const index = Math.min(ELEMENT_KEYS.length - 1, Math.floor(jitter(spawnId * 2.718) * ELEMENT_KEYS.length));
  return ELEMENT_KEYS[index];
}

// A slow, looping drift path through a handful of waypoints inside the tank — every atom gets its
// own path (seeded by its spawn id) so the tank never looks like one synchronized group.
function driftPath(spawnId) {
  const waypointCount = 4;
  const xs = [];
  const ys = [];
  for (let i = 0; i < waypointCount; i++) {
    xs.push(14 + jitter(spawnId * 3.17 + i * 1.7) * 72);
    ys.push(18 + jitter(spawnId * 4.73 + i * 2.31) * 62);
  }
  xs.push(xs[0]);
  ys.push(ys[0]);
  return { xs, ys, duration: 11 + jitter(spawnId * 9.91) * 7 };
}

function FloatingAtom({ slot, onCollect }) {
  const path = useMemo(() => driftPath(slot.spawnId), [slot.spawnId]);
  const meta = ELEMENT_META[slot.element];
  const collecting = slot.status === 'collecting';

  return (
    <motion.button
      onClick={onCollect}
      disabled={collecting}
      className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
      initial={{ left: `${path.xs[0]}%`, top: `${path.ys[0]}%`, opacity: 0, scale: 0.5 }}
      animate={{
        left: path.xs.map((x) => `${x}%`),
        top: path.ys.map((y) => `${y}%`),
        opacity: collecting ? 0 : 1,
        scale: collecting ? 0.3 : 1,
      }}
      transition={{
        left: { duration: path.duration, repeat: Infinity, ease: 'linear' },
        top: { duration: path.duration, repeat: Infinity, ease: 'linear' },
        opacity: { duration: collecting ? 0.3 : 0.5 },
        scale: { duration: collecting ? 0.3 : 0.5 },
      }}
    >
      <span
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 text-base font-bold shadow-lg transition-transform hover:scale-110 sm:h-12 sm:w-12 sm:text-lg"
        style={{ borderColor: meta.color, color: meta.color, backgroundColor: `${meta.color}22` }}
      >
        {meta.symbol}
      </span>
    </motion.button>
  );
}

function TestingPhase({ onReadyForQuantum }) {
  const [slots, setSlots] = useState(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => ({ spawnId: i, element: generateAtom(i), status: 'floating' }))
  );
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [tried, setTried] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const nextSpawnId = useRef(SLOT_COUNT);
  const timeoutsRef = useRef([]);

  useEffect(
    () => () => {
      timeoutsRef.current.forEach(clearTimeout);
    },
    []
  );

  const totalAtoms = counts.c + counts.h + counts.n + counts.o;
  const bestSoFar = tried.reduce((best, m) => (m.score > (best?.score ?? -1) ? m : best), null);

  function handleCollect(slotIndex) {
    const slot = slots[slotIndex];
    if (slot.status !== 'floating') return;

    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? { ...s, status: 'collecting' } : s)));
    setCounts((prev) => ({ ...prev, [slot.element]: prev[slot.element] + 1 }));

    const respawnTimer = setTimeout(() => {
      const spawnId = nextSpawnId.current++;
      setSlots((prev) =>
        prev.map((s, i) => (i === slotIndex ? { spawnId, element: generateAtom(spawnId), status: 'floating' } : s))
      );
    }, COLLECT_POP_MS);
    timeoutsRef.current.push(respawnTimer);
  }

  function handleTest() {
    if (totalAtoms === 0) return;
    const { c, h, n, o } = counts;
    const entry = { c, h, n, o, score: scoreFor(c, h, n, o), formula: formatFormula(c, h, n, o) };
    setLastResult(entry);
    setTried((prev) => {
      const key = formulaKey(c, h, n, o);
      return prev.some((m) => formulaKey(m.c, m.h, m.n, m.o) === key) ? prev : [...prev, entry];
    });
    setCounts(EMPTY_COUNTS);
  }

  const verdict = lastResult ? verdictFor(lastResult.score) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-4xl flex-col justify-center gap-3 px-6 py-4"
    >
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Synthesis Tank</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Catch Atoms, Build a Molecule</h2>
        <p className="mx-auto mt-1.5 max-w-2xl text-xs text-slate-400 sm:text-sm">
          Click floating atoms to pull them into your flask, then test whatever combination you've built —
          somewhere among the {TOTAL_COMBINATIONS.toLocaleString()} possible arrangements is a real cure.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative h-44 flex-1 overflow-hidden rounded-2xl border border-slate-700 bg-black/80 shadow-2xl shadow-black/60 sm:h-56">
          <div className="pointer-events-none absolute left-0 top-0 z-10 flex items-center gap-2 p-3">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="ml-1 font-mono text-[10px] text-slate-500">molecular_tank.exe</span>
          </div>

          {slots.map((slot, i) => (
            <FloatingAtom key={slot.spawnId} slot={slot} onCollect={() => handleCollect(i)} />
          ))}
        </div>

        <div className="sm:w-60 sm:shrink-0">
          <GuideBubble message={GUIDE_MESSAGES[tried.length]} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-center sm:col-span-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Your Flask</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {ELEMENT_KEYS.map((key) => {
              const meta = ELEMENT_META[key];
              return (
                <span
                  key={key}
                  className="flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs"
                  style={{ borderColor: meta.color, color: meta.color }}
                >
                  {meta.symbol} × {counts[key]}
                </span>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-xl font-bold text-white">{formatFormula(counts.c, counts.h, counts.n, counts.o)}</p>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleTest}
              disabled={totalAtoms === 0}
              className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              🧪 Test This Molecule
            </button>
            {totalAtoms > 0 && (
              <button
                onClick={() => setCounts(EMPTY_COUNTS)}
                className="text-xs text-slate-500 underline decoration-dotted hover:text-slate-300"
              >
                Empty flask
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {lastResult && (
              <motion.div
                key={formulaKey(lastResult.c, lastResult.h, lastResult.n, lastResult.o)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2.5 rounded-xl border border-slate-700 bg-slate-900/70 p-2.5"
              >
                <p className="font-mono text-base font-bold text-white">{lastResult.formula}</p>
                <p className={`text-xs font-semibold ${verdict.cls}`}>{verdict.label}</p>
                <p className="text-[11px] text-slate-500">
                  Effectiveness score: <span className="font-mono text-slate-300">{Math.round(lastResult.score * 100)}%</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-slate-400 sm:text-sm">
          <span>
            Molecules tested: <span className="font-semibold text-white">{tried.length}</span> of{' '}
            <span className="font-semibold text-white">{TOTAL_COMBINATIONS.toLocaleString()}</span>
          </span>
          {bestSoFar && (
            <span>
              Best so far: <span className="font-mono text-cyan-300">{bestSoFar.formula}</span> at{' '}
              <span className="text-cyan-300">{Math.round(bestSoFar.score * 100)}%</span>
            </span>
          )}
        </div>
      </div>

      {tried.length >= MIN_TESTS_BEFORE_QUANTUM && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-center"
        >
          <p className="text-xs text-slate-200 sm:text-sm">
            Catching atoms one at a time and testing each mix by hand would take far longer than the
            outbreak allows. There's a faster way.
          </p>
          <button
            onClick={() => onReadyForQuantum(tried)}
            className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-purple-500/30 transition hover:brightness-110"
          >
            ⚛ Let the Quantum AI Search
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function SearchingPhase({ tried, onComplete }) {
  const candidates = useMemo(() => buildCandidates(tried), [tried]);
  const cureIndex = candidates.findIndex((cand) => isCure(cand.c, cand.h, cand.n, cand.o));
  const [amplitudes, setAmplitudes] = useState(() => uniformAmplitudes(candidates.length));
  const [iteration, setIteration] = useState(0);
  const [phase, setPhase] = useState('oracle'); // 'oracle' | 'diffusion'
  const [measuring, setMeasuring] = useState(false);
  const totalIterations = optimalIterations(candidates.length);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      let current = uniformAmplitudes(candidates.length);
      for (let i = 0; i < totalIterations; i++) {
        if (cancelled) return;
        setPhase('oracle');
        setIteration(i);
        await sleep(650);
        current = applyOracle(current, cureIndex);
        if (cancelled) return;
        setAmplitudes(current);
        await sleep(500);

        if (cancelled) return;
        setPhase('diffusion');
        await sleep(650);
        current = applyDiffusion(current);
        if (cancelled) return;
        setAmplitudes(current);
        await sleep(700);
      }
      if (cancelled) return;
      setMeasuring(true);
      await sleep(1400);
      if (cancelled) return;
      onComplete(candidates[cureIndex]);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxProb = Math.max(...amplitudes.map((a) => a ** 2));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-4xl px-6 py-12"
    >
      <div className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Quantum AI Search</p>
        <h2 className="mt-2 text-3xl font-bold text-white">Amplifying the Best Candidate</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
          The same oracle-and-diffusion trick behind Grover's algorithm, run across every candidate
          molecule at once — each round bends the odds further toward the real cure.
        </p>
      </div>

      {!measuring ? (
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-violet-300">
          Round {iteration + 1} of {totalIterations} — {phase === 'oracle' ? 'marking the target compound' : 'amplifying its probability'}
        </p>
      ) : (
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-emerald-300">
          Measuring quantum state…
        </p>
      )}

      <div className="flex h-56 items-end justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        {amplitudes.map((a, i) => {
          const prob = a ** 2;
          const isCureBar = i === cureIndex;
          return (
            <div key={i} className="flex flex-1 max-w-16 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">{Math.round(prob * 100)}%</span>
              <div className="flex h-36 w-full items-end overflow-visible rounded bg-slate-900">
                <motion.div
                  animate={{ height: `${Math.min(100, (prob / Math.max(maxProb, 0.01)) * 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className={`w-full rounded ${isCureBar ? 'bg-cyan-400' : 'bg-slate-600'} ${a < 0 ? 'opacity-50' : ''}`}
                />
              </div>
              <span className="font-mono text-[10px] text-slate-400">{candidates[i].formula}</span>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {measuring && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center justify-center gap-2"
          >
            <QuantumCore stage="alive" className="h-6 w-6" particleCount={5} detail="minimal" />
            <p className="text-sm text-slate-300">Collapsing to a single outcome…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function OutcomePhase({ onReplay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-2xl px-6 py-16 text-center"
    >
      <div className="flex items-center justify-center gap-2">
        <QuantumCore stage="stabilizing" className="h-9 w-9" particleCount={6} detail="minimal" />
        <p className="text-xs uppercase tracking-widest text-emerald-400">Cure Identified</p>
      </div>
      <h1 className="mt-3 text-3xl font-bold text-white">{CURE_NAME}</h1>
      <p className="mt-2 font-mono text-2xl text-cyan-300">{formatFormula(CURE.c, CURE.h, CURE.n, CURE.o)}</p>
      <p className="mt-2 text-sm text-slate-400">
        Effectiveness score: <span className="text-emerald-300">{Math.round(CURE_SCORE * 100)}%</span> — by far the
        strongest result found.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-left">
        <p className="text-sm font-semibold text-cyan-300">The lesson</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Drug discovery is exactly the kind of problem Grover's algorithm was built for: an enormous,
          unstructured space of candidates with no shortcut to check them in order, and no pattern to sort
          by. You can only test one and see. Classically, finding one winner among {TOTAL_COMBINATIONS.toLocaleString()}
          {' '}candidates means checking roughly half of them on average. A quantum computer running Grover's
          algorithm needs only about the square root of that many steps. That's the same quadratic speedup
          used to crack a password in this app's first mission, now pointed at molecules instead of
          passwords. It's why pharmaceutical research, materials science, and logistics are some of the
          fields most excited about quantum computing, and most exposed to it.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onReplay} className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
          Run It Back
        </button>
        <Link
          to="/missions"
          className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Finish Mission
        </Link>
      </div>
    </motion.div>
  );
}

function MoleculeMission() {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'testing' | 'searching' | 'outcome'
  const [visibleLines, setVisibleLines] = useState([]);
  const [triedMolecules, setTriedMolecules] = useState([]);

  useEffect(() => {
    const timers = INTRO_LINES.map((line) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, line]), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const introDone = visibleLines.length === INTRO_LINES.length;

  function handleReadyForQuantum(tried) {
    setTriedMolecules(tried);
    setPhase('searching');
  }

  function handleSearchComplete() {
    setPhase('outcome');
  }

  function handleReplay() {
    setTriedMolecules([]);
    setPhase('testing');
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="flex items-center justify-center gap-2 border-b border-slate-800/60 py-3">
        <QuantumCore stage="alive" className="h-5 w-5" particleCount={5} detail="minimal" />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Molecular Synthesis Lab</span>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' ? (
          <motion.div
            key="intro"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
          >
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
              <div className="mb-6 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-orange-400/80">Mission 3 — Lost Medical Breakthrough</p>
                <h1 className="mt-2 text-3xl font-bold text-white">A Cure Is Buried in the Search Space</h1>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-black/80 p-6 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-2 font-mono text-xs text-slate-500">molecular_search.exe</span>
                </div>
                <div className="min-h-40 space-y-1 font-mono">
                  {visibleLines.map((line) => (
                    <motion.p
                      key={line.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`text-sm leading-7 ${line.cls}`}
                    >
                      {line.text}
                    </motion.p>
                  ))}
                  {!introDone && visibleLines.length > 0 && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.7 }}
                      className="inline-block h-4 w-2 bg-green-400"
                    />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {introDone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 flex justify-center"
                  >
                    <button
                      onClick={() => setPhase('testing')}
                      className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                      Begin Synthesis
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : phase === 'testing' ? (
          <TestingPhase key="testing" onReadyForQuantum={handleReadyForQuantum} />
        ) : phase === 'searching' ? (
          <SearchingPhase key="searching" tried={triedMolecules} onComplete={handleSearchComplete} />
        ) : (
          <OutcomePhase key="outcome" onReplay={handleReplay} />
        )}
      </AnimatePresence>
    </main>
  );
}

export default MoleculeMission;
