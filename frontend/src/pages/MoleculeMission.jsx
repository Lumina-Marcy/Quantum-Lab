import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Microscope, FlaskConical, CircleCheck } from 'lucide-react';
import QuantumCore from '../components/QuantumCore';
import Panel from '../components/Panel';
import { jitter } from '../utils/deterministicRandom';
import { pickRandomFocus, randomTargetFormula, randomTargetScore, randomTargetName } from '../data/diseaseFoci';
import { ELEMENT_KEYS, ELEMENT_META } from '../data/elements';
import MoleculeDiagram from '../components/MoleculeDiagram';
import QuantumMolecularSearch from '../components/QuantumMolecularSearch';
import HealthyCellField from '../components/HealthyCellField';
import QuantumDefinition from '../components/QuantumDefinition';

const ELEMENT_COUNT = 4; // Carbon, Hydrogen, Nitrogen, Oxygen
const MAX_PER_ELEMENT = 49;
const VALUES_PER_ELEMENT = MAX_PER_ELEMENT + 1;
const TOTAL_COMBINATIONS = VALUES_PER_ELEMENT ** ELEMENT_COUNT;

function buildIntroLines(focus) {
  return [
    { id: 1, delay: 400, text: `> Threat identified: ${focus.disease} — every existing treatment on file is ineffective...`, cls: 'text-orange-400' },
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
}

const WALKTHROUGH_SLIDES = [
  {
    kicker: 'How To Play — Step 1',
    title: 'Choose Molecular Building Blocks',
    body: 'Catch drifting atoms — Carbon, Hydrogen, Nitrogen, and Oxygen — the same chemical building blocks common in real drug discovery.',
  },
  {
    kicker: 'How To Play — Step 2',
    title: 'Watch Your Candidate Assemble',
    body: "Every compound you catch joins your candidate medicine in real time, growing more complex right in front of you.",
  },
  {
    kicker: 'How To Play — Step 3',
    title: 'Test Your Candidate',
    body: 'Classical research can only evaluate one possibility at a time — most candidates fail, and that’s expected.',
  },
  {
    kicker: 'How To Play — Step 4',
    title: 'Quantum Simulation Takes Over',
    body: 'After three unsuccessful attempts, Quantum Lab demonstrates quantum simulation exploring many possibilities simultaneously.',
  },
];

function isCure(c, h, n, o, target) {
  return c === target.c && h === target.h && n === target.n && o === target.o;
}

// Every non-cure formula gets a deterministic score in [0.04, 0.60) from a hashed seed — stable
// across renders/replays (same idiom as QuantumCore.jsx's `jitter`-based layouts), so testing the
// same formula twice always reports the same result.
function scoreFor(c, h, n, o, target, targetScore) {
  if (isCure(c, h, n, o, target)) return targetScore;
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

function buildCandidates(tried, target, targetScore) {
  const seen = new Set();
  const candidates = [];

  function tryAdd(c, h, n, o) {
    const key = formulaKey(c, h, n, o);
    if (seen.has(key)) return false;
    seen.add(key);
    candidates.push({ c, h, n, o, score: scoreFor(c, h, n, o, target, targetScore), formula: formatFormula(c, h, n, o) });
    return true;
  }

  // The player's own attempts always make the cut first — the reveal should feel like it's
  // searching among the compounds they actually explored, not a totally unrelated set.
  for (const m of tried) {
    if (candidates.length >= CANDIDATE_SLOTS - 1) break;
    tryAdd(m.c, m.h, m.n, m.o);
  }

  tryAdd(target.c, target.h, target.n, target.o);

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
const MAX_CLASSICAL_ATTEMPTS = 3;
const COLLECT_POP_MS = 300; // how long an atom's "pop into the flask" animation plays before it respawns

const EMPTY_COUNTS = { c: 0, h: 0, n: 0, o: 0 };

// Classical research gets exactly three scripted attempts, each framed a little more ambitiously
// than the last — the player should feel like they're improving even though the underlying method
// (testing one candidate at a time) never actually stands a real chance.
const ATTEMPT_LABELS = {
  1: { kicker: 'Attempt 1 of 3 — Initial Synthesis', guide: 'Classical research can only test one candidate at a time. Most fail — that\'s expected.' },
  2: { kicker: 'Attempt 2 of 3 — Refined Synthesis', guide: 'A more deliberate combination this time — but testing one at a time still means most possibilities go unexplored.' },
  3: {
    kicker: 'Attempt 3 of 3 — Advanced Synthesis',
    guide: 'Your most sophisticated candidate yet. Even so, checking 6,250,000 possibilities by hand one at a time was never realistic.',
  },
};

// The required cinematic beat sequence for a failed classical candidate — each line advances the
// molecular diagram's `mode` so the visual destabilization tracks the narration.
const FAILURE_LINES = [
  { id: 1, text: 'Instability detected.', mode: 'destabilizing' },
  { id: 2, text: 'Chemical bonds weaken.', mode: 'destabilizing' },
  { id: 3, text: 'The molecule begins glowing red.', mode: 'destabilizing' },
  { id: 4, text: 'Small fractures spread through the structure.', mode: 'destabilizing' },
  { id: 5, text: 'The molecule destabilizes.', mode: 'destabilizing' },
  { id: 6, text: 'Atoms separate.', mode: 'dissolving' },
  { id: 7, text: 'The structure dissolves into glowing particles.', mode: 'dissolving' },
  { id: 8, text: 'The Quantum Core absorbs the remaining particles.', mode: 'dissolving' },
  { id: 9, text: 'The molecular workspace resets.', mode: 'dissolving' },
];
const FAILURE_LINE_INTERVAL_MS = 900;
const FAILURE_HOLD_MS = 1400;
const CLASSICAL_SCAN_MS = 1800;

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
          <span className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-300 sm:text-xs">
            <Microscope className="h-3 w-3" /> Lab Assistant
          </span>
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

function FloatingAtom({ slot, onCollect, onHoverChange }) {
  const path = useMemo(() => driftPath(slot.spawnId), [slot.spawnId]);
  const meta = ELEMENT_META[slot.element];
  const collecting = slot.status === 'collecting';

  return (
    <motion.button
      onClick={onCollect}
      disabled={collecting}
      onHoverStart={() => onHoverChange?.(true)}
      onHoverEnd={() => onHoverChange?.(false)}
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

function TestingPhase({ onSubmit, onHoverChange, attemptNumber }) {
  const [slots, setSlots] = useState(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => ({ spawnId: i, element: generateAtom(i), status: 'floating' }))
  );
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [addedAtoms, setAddedAtoms] = useState([]);
  const nextSpawnId = useRef(SLOT_COUNT);
  const timeoutsRef = useRef([]);

  useEffect(
    () => () => {
      timeoutsRef.current.forEach(clearTimeout);
    },
    []
  );

  const totalAtoms = counts.c + counts.h + counts.n + counts.o;
  const label = ATTEMPT_LABELS[attemptNumber] || ATTEMPT_LABELS[1];

  function handleCollect(slotIndex) {
    const slot = slots[slotIndex];
    if (slot.status !== 'floating') return;

    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? { ...s, status: 'collecting' } : s)));
    setCounts((prev) => ({ ...prev, [slot.element]: prev[slot.element] + 1 }));
    setAddedAtoms((prev) => [...prev, { element: slot.element, order: prev.length }]);

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
    onSubmit(counts);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-4xl flex-col justify-center gap-3 px-6 py-4"
    >
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">{label.kicker}</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Catch Atoms, Build a Molecule</h2>
        <p className="mx-auto mt-1.5 max-w-2xl text-xs text-slate-400 sm:text-sm">
          Click floating atoms to pull them into your flask — watch your candidate molecule assemble in
          real time, then test whatever you've built. Somewhere among the {TOTAL_COMBINATIONS.toLocaleString()}
          {' '}possible arrangements is a real cure.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="relative flex min-h-[16rem] items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-black/70 shadow-2xl shadow-black/60">
          <MoleculeDiagram composition={counts} addedAtoms={addedAtoms} seedKey="assembly" mode="assembling" size="workspace" />
          {totalAtoms === 0 && (
            <div className="absolute bottom-4 right-4 opacity-70">
              <QuantumCore stage="alive" className="h-12 w-12" particleCount={6} detail="minimal" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative h-40 overflow-hidden rounded-2xl border border-slate-700 bg-black/80 shadow-2xl shadow-black/60">
            <div className="pointer-events-none absolute left-0 top-0 z-10 flex items-center gap-2 p-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="ml-1 font-mono text-[10px] text-slate-500">molecular_tank.exe</span>
            </div>

            {slots.map((slot, i) => (
              <FloatingAtom key={slot.spawnId} slot={slot} onCollect={() => handleCollect(i)} onHoverChange={onHoverChange} />
            ))}
          </div>

          <GuideBubble message={label.guide} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4 text-center sm:col-span-2">
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
              onPointerEnter={() => onHoverChange?.(true)}
              onPointerLeave={() => onHoverChange?.(false)}
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FlaskConical className="h-4 w-4" /> Test This Molecule
            </button>
            {totalAtoms > 0 && (
              <button
                onClick={() => {
                  setCounts(EMPTY_COUNTS);
                  setAddedAtoms([]);
                }}
                className="text-xs text-slate-500 underline decoration-dotted hover:text-slate-300"
              >
                Empty flask
              </button>
            )}
          </div>

        </Panel>

        <Panel className="flex flex-col justify-center gap-2 px-4 py-3 text-xs text-slate-400 sm:text-sm">
          <span>
            Classical attempt: <span className="font-semibold text-white">{attemptNumber}</span> of{' '}
            <span className="font-semibold text-white">{MAX_CLASSICAL_ATTEMPTS}</span>
          </span>
          <span>
            Search space: <span className="font-mono text-cyan-300">{TOTAL_COMBINATIONS.toLocaleString()}</span> possible
            arrangements
          </span>
        </Panel>
      </div>
    </motion.div>
  );
}

function SearchingPhase({ tried, onComplete, onProgress, target, targetScore }) {
  const candidates = useMemo(() => buildCandidates(tried, target, targetScore), [tried, target, targetScore]);
  const cureIndex = candidates.findIndex((cand) => isCure(cand.c, cand.h, cand.n, cand.o, target));
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
        onProgress?.(i / totalIterations);
        await sleep(1300);
        current = applyOracle(current, cureIndex);
        if (cancelled) return;
        setAmplitudes(current);
        await sleep(1000);

        if (cancelled) return;
        setPhase('diffusion');
        await sleep(1300);
        current = applyDiffusion(current);
        if (cancelled) return;
        setAmplitudes(current);
        await sleep(1400);
      }
      if (cancelled) return;
      setMeasuring(true);
      onProgress?.(1);
      await sleep(1800);
      if (cancelled) return;
      onComplete(candidates, current, cureIndex);
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-4xl px-6 py-12"
    >
      <div className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Quantum Molecular Simulation</p>
        <h2 className="mt-2 text-3xl font-bold text-white">Exploring Every Possibility At Once</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
          The same <QuantumDefinition term="oracle" />-and-<QuantumDefinition term="diffusion" /> trick behind
          Grover's algorithm, run across every candidate molecule at once — watch the search space narrow
          toward the real cure.
        </p>
      </div>

      {!measuring ? (
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-violet-300">
          Round {iteration + 1} of {totalIterations} — {phase === 'oracle' ? 'marking the target compound' : 'amplifying its probability'}
        </p>
      ) : (
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-emerald-300">
          Measuring quantum state… Candidate Identified.
        </p>
      )}

      <QuantumMolecularSearch
        candidates={candidates}
        amplitudes={amplitudes}
        cureIndex={cureIndex}
        roundPhase={phase}
        iteration={iteration}
        measuring={measuring}
      />

      <AnimatePresence>
        {measuring && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center justify-center gap-2"
          >
            <p className="text-sm text-slate-300">Collapsing to a single outcome…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Bar chart relocated here from the old SearchingPhase — visualization comes first (the branching
// QuantumMolecularSearch), statistics second, per the brief's "graphs support, never replace."
function StatisticsPhase({ searchResult, targetName, onContinue }) {
  if (!searchResult) return null;
  const { candidates, amplitudes, cureIndex } = searchResult;
  const maxProb = Math.max(...amplitudes.map((a) => a ** 2), 0.01);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-4xl px-6 py-12"
    >
      <div className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Candidate Identified</p>
        <h2 className="mt-2 text-3xl font-bold text-white">{targetName}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
          Here's the probability data behind what you just watched.
        </p>
      </div>

      <Panel className="flex h-56 items-end justify-center gap-2 p-4">
        {amplitudes.map((a, i) => {
          const prob = a ** 2;
          const isCureBar = i === cureIndex;
          return (
            <div key={i} className="flex flex-1 max-w-16 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">{Math.round(prob * 100)}%</span>
              <div className="flex h-36 w-full items-end overflow-visible rounded bg-slate-900">
                <div
                  style={{ height: `${Math.min(100, (prob / maxProb) * 100)}%` }}
                  className={`w-full rounded ${isCureBar ? 'bg-cyan-400' : 'bg-slate-600'}`}
                />
              </div>
              <span className="font-mono text-[10px] text-slate-400">{candidates[i].formula}</span>
            </div>
          );
        })}
      </Panel>

      <div className="mt-8 flex justify-center">
        <button onClick={onContinue} className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
          Continue
        </button>
      </div>
    </motion.div>
  );
}

function DebriefPhase({ onContinue, target, targetScore, targetName, attemptHistory }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="mx-auto max-w-2xl px-6 py-16 text-center"
    >
      <div className="relative mx-auto flex h-80 w-80 items-center justify-center">
        <HealthyCellField />
        {attemptHistory.map((cand, i) => {
          const leftPct = 50 + (jitter(i * 3.3 + 1) - 0.5) * 70;
          const topPct = 50 + (jitter(i * 5.5 + 2) - 0.5) * 70;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              initial={{ opacity: 0.3, scale: 0.6 }}
              animate={{ opacity: 0, scale: 0.2 }}
              transition={{ duration: 2.2, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
            >
              <MoleculeDiagram composition={cand} seedKey={cand.formula} mode="ghost" size="mini" />
            </motion.div>
          );
        })}
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}>
          <MoleculeDiagram composition={target} seedKey="debrief-target" mode="stabilizing" size="workspace" />
        </motion.div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <CircleCheck className="h-4 w-4 text-emerald-400" />
        <p className="text-xs uppercase tracking-widest text-emerald-400">Candidate Identified</p>
      </div>
      <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{targetName}</h1>
      <p className="mt-2 font-mono text-2xl text-cyan-300">{formatFormula(target.c, target.h, target.n, target.o)}</p>
      <p className="mt-2 text-sm text-slate-400">
        Effectiveness score: <span className="text-emerald-300">{Math.round(targetScore * 100)}%</span> — by far the
        strongest result found.
      </p>

      <div className="mt-10 border-t border-white/[0.06] pt-8">
        <p className="text-sm leading-relaxed text-slate-300">
          Out of millions of possible molecular arrangements, quantum simulation identified one promising
          candidate within seconds. This illustrates one of quantum computing's greatest strengths:
          simulating molecular interactions that would take classical approaches dramatically longer to
          evaluate.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <button onClick={onContinue} className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
          Continue
        </button>
      </div>
    </motion.div>
  );
}

function GroundingPhase({ onReplay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-xl px-6 py-16 text-center"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Before You Go</p>
      <p className="mt-4 text-sm leading-relaxed text-slate-300">
        Today's simulation was simplified for learning. In the real world, scientists explore
        astronomical numbers of molecular possibilities. Quantum computing won't invent medicine on its
        own—but it may help researchers find promising candidates faster than ever before.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onReplay} className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
          Run It Back
        </button>
        <Link to="/missions" className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
          Finish Mission
        </Link>
      </div>
    </motion.div>
  );
}

const TRANSITION_STAT_BASE_MS = 400;
const TRANSITION_STAT_STAGGER_MS = 260;
const TRANSITION_SILENCE_MS = 3000; // the app's established longest deliberate pause (PasswordMission.jsx's readiness check)

// Reuses PasswordMission.jsx's "Mission Readiness Check" idiom almost verbatim: staggered stat
// reveal, a synced hold, then a long silent pause before auto-advancing — the closest existing
// precedent for this brief's "Pause. Allow silence." transition-to-quantum beat.
function TransitionPhase({ attemptHistory, onComplete }) {
  const stats = useMemo(() => {
    const best = attemptHistory.reduce((b, m) => (m.score > (b?.score ?? -1) ? m : b), null);
    return [
      { label: 'Candidates synthesized', value: String(attemptHistory.length) },
      { label: 'Best result so far', value: best ? `${best.formula} — ${Math.round(best.score * 100)}%` : '—' },
      { label: 'Remaining possibilities', value: (TOTAL_COMBINATIONS - attemptHistory.length).toLocaleString() },
      { label: 'Classical time estimate', value: 'Centuries' },
    ];
  }, [attemptHistory]);

  const [revealed, setRevealed] = useState(0);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const timers = stats.map((_, i) =>
      setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), TRANSITION_STAT_BASE_MS + i * TRANSITION_STAT_STAGGER_MS)
    );
    const syncDelay = TRANSITION_STAT_BASE_MS + stats.length * TRANSITION_STAT_STAGGER_MS + 400;
    const syncTimer = setTimeout(() => setSynced(true), syncDelay);
    const advanceTimer = setTimeout(onComplete, syncDelay + TRANSITION_SILENCE_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(syncTimer);
      clearTimeout(advanceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-6 px-6 py-10 text-center"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-purple-300/80">Mission Control</p>
      <h2 className="text-2xl font-bold text-white">Classical molecular simulation has reached practical limits.</h2>

      <div className="w-full space-y-3">
        {stats.slice(0, revealed).map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/40 px-4 py-2.5 text-sm"
          >
            <span className="text-slate-400">{stat.label}</span>
            <span className="font-mono text-cyan-200">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {synced && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-sm text-purple-200"
          >
            Quantum Core synchronized. Preparing simulation...
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MoleculeMission() {
  // 'briefing' | 'walkthrough' | 'testing' | 'classicalTesting' | 'failure' | 'transition' |
  // 'searching' | 'statistics' | 'debrief' | 'grounding'
  const [phase, setPhase] = useState('briefing');
  const [visibleLines, setVisibleLines] = useState([]);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [pendingCandidate, setPendingCandidate] = useState(null);
  const [failureLineIndex, setFailureLineIndex] = useState(0);

  // The target molecule is rolled fresh per mount (and re-rolled on replay, see handleReplay) so
  // every playthrough hunts for a different compound — `scoreFor`'s non-cure branch never reads
  // this state, so swapping it changes zero balance math, only which formula wins.
  const [focus, setFocus] = useState(() => pickRandomFocus());
  const [target, setTarget] = useState(() => randomTargetFormula());
  const [targetScore, setTargetScore] = useState(() => randomTargetScore());
  const [targetName, setTargetName] = useState(() => randomTargetName(focus));
  const introLines = useMemo(() => buildIntroLines(focus), [focus]);

  // This mission never truly fails — classical attempts are scripted to fail so the quantum
  // simulation has something to solve, and the search always lands on the target — so the Core's
  // reactivity leans toward building excitement (blue pulse) with a deliberate red 'unstable' dip
  // during each classical failure, mirroring PasswordMission.jsx's established idiom.
  const [coreStage, setCoreStage] = useState('alive');
  const [hoveredActionable, setHoveredActionable] = useState(false);
  const [searchFrac, setSearchFrac] = useState(0);
  const [searchResult, setSearchResult] = useState(null); // { candidates, amplitudes, cureIndex } — for the statistics phase
  const corePulse = useMotionValue(0);
  const pulseScale = useTransform(corePulse, [0, 1], [0.4, 2.2]);
  const pulseOpacity = useTransform(corePulse, [0, 0.15, 1], [0, 0.55, 0]);
  const coreProgress = useMotionValue(0.3);

  useEffect(() => {
    const timers = introLines.map((line) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, line]), line.delay)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const introDone = visibleLines.length === introLines.length;

  useEffect(() => {
    let progressTarget = 0.3;
    if (phase === 'testing') {
      progressTarget = 0.3 + 0.15 * (attemptNumber - 1);
    } else if (phase === 'classicalTesting') {
      progressTarget = 0.35 + 0.15 * (attemptNumber - 1);
    } else if (phase === 'failure') {
      progressTarget = 0.25;
    } else if (phase === 'transition') {
      progressTarget = 0.85;
    } else if (phase === 'searching') {
      progressTarget = 0.5 + 0.4 * searchFrac;
    } else if (phase === 'statistics' || phase === 'debrief' || phase === 'grounding') {
      progressTarget = targetScore;
    }
    const controls = animate(coreProgress, progressTarget, { duration: 1.2, ease: 'easeInOut' });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attemptNumber, searchFrac]);

  // Every classical attempt is scored for real (via scoreFor) but is scripted to play out as a
  // failure — landing on the true target by hand-catching atoms is a 1-in-6,250,000 shot, so
  // treating every manual attempt as narrative "instability" costs nothing in practice while
  // letting the mission tell the required 3-attempt failure arc.
  function handleSubmitCandidate(counts) {
    const { c, h, n, o } = counts;
    const entry = { c, h, n, o, score: scoreFor(c, h, n, o, target, targetScore), formula: formatFormula(c, h, n, o) };
    setPendingCandidate(entry);
    setAttemptHistory((prev) => [...prev, entry]);
    setCoreStage('loading');
    setPhase('classicalTesting');
  }

  useEffect(() => {
    if (phase !== 'classicalTesting') return undefined;
    const timer = setTimeout(() => {
      setFailureLineIndex(0);
      setCoreStage('unstable');
      setPhase('failure');
    }, CLASSICAL_SCAN_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'failure') return undefined;
    const timers = FAILURE_LINES.map((_, i) => setTimeout(() => setFailureLineIndex(i), i * FAILURE_LINE_INTERVAL_MS));
    const completeTimer = setTimeout(() => {
      setCoreStage('alive');
      setAttemptNumber((n) => {
        if (n < MAX_CLASSICAL_ATTEMPTS) {
          setPendingCandidate(null);
          setPhase('testing');
          return n + 1;
        }
        setPhase('transition');
        return n;
      });
    }, FAILURE_LINES.length * FAILURE_LINE_INTERVAL_MS + FAILURE_HOLD_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [phase]);

  function handleSearchComplete(candidates, amplitudes, cureIndex) {
    setSearchResult({ candidates, amplitudes, cureIndex });
    setCoreStage('stabilizing');
    animate(corePulse, [0, 1], { duration: 1.1, ease: 'easeOut' });
    setPhase('statistics');
  }

  function handleReplay() {
    const nextFocus = pickRandomFocus();
    setFocus(nextFocus);
    setTarget(randomTargetFormula());
    setTargetScore(randomTargetScore());
    setTargetName(randomTargetName(nextFocus));
    setAttemptHistory([]);
    setAttemptNumber(1);
    setPendingCandidate(null);
    setFailureLineIndex(0);
    setSearchFrac(0);
    setSearchResult(null);
    setCoreStage('alive');
    setPhase('testing');
  }

  const coreSpeed = phase === 'transition' || phase === 'searching' ? 2.2 : 1;

  return (
    <main className="min-h-screen bg-transparent">
      <AnimatePresence>
        {(phase === 'transition' || phase === 'searching') && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-center gap-4 border-b border-white/[0.06] py-6">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute h-20 w-20 rounded-full"
          style={{
            scale: pulseScale,
            opacity: pulseOpacity,
            background: 'radial-gradient(circle, rgba(191,219,254,0.65) 0%, rgba(59,130,246,0.3) 45%, transparent 72%)',
          }}
        />
        <motion.div
          animate={{ scale: hoveredActionable ? 1.08 : 1, filter: hoveredActionable ? 'brightness(1.25)' : 'brightness(1)' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <QuantumCore stage={coreStage} progress={coreProgress} className="h-14 w-14" particleCount={10} speedMultiplier={coreSpeed} />
        </motion.div>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Molecular Synthesis Lab</span>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'briefing' ? (
          <motion.div
            key="briefing"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
          >
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
              <div className="mb-6 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-orange-400/80">Mission 1 — Lost Medical Breakthrough</p>
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
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Objective</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Today's challenge is to discover a promising therapeutic molecule for {focus.disease}. Using
                      classical methods, scientists must test molecular combinations one at a time.{' '}
                      <QuantumDefinition term="quantumComputer">Quantum computing</QuantumDefinition> offers the
                      possibility of exploring countless molecular possibilities simultaneously — your objective is
                      to experience the difference firsthand.
                    </p>
                    <div className="mt-5 flex justify-center">
                      <button
                        onClick={() => setPhase('walkthrough')}
                        className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : phase === 'walkthrough' ? (
          <motion.div
            key="walkthrough"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
          >
            <div className="w-full max-w-lg">
              <p className="text-center text-xs uppercase tracking-[0.3em] text-cyan-300/80">How To Play</p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={walkthroughStep}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 rounded-2xl border border-slate-700 bg-black/60 p-6 text-center shadow-2xl shadow-black/60"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {WALKTHROUGH_SLIDES[walkthroughStep].kicker}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-white">{WALKTHROUGH_SLIDES[walkthroughStep].title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {WALKTHROUGH_SLIDES[walkthroughStep].body}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex items-center justify-center gap-2">
                {WALKTHROUGH_SLIDES.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === walkthroughStep ? 'w-6 bg-cyan-400' : 'w-1.5 bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setWalkthroughStep((s) => Math.max(0, s - 1))}
                  disabled={walkthroughStep === 0}
                  className="rounded-full border border-slate-700 px-5 py-2.5 text-sm text-slate-300 transition hover:border-slate-500 disabled:opacity-30"
                >
                  Back
                </button>
                {walkthroughStep < WALKTHROUGH_SLIDES.length - 1 ? (
                  <button
                    onClick={() => setWalkthroughStep((s) => Math.min(WALKTHROUGH_SLIDES.length - 1, s + 1))}
                    className="rounded-full bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setPhase('testing')}
                    className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-purple-500/30 hover:brightness-110"
                  >
                    Begin Research
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : phase === 'testing' ? (
          <TestingPhase key={`testing-${attemptNumber}`} onSubmit={handleSubmitCandidate} onHoverChange={setHoveredActionable} attemptNumber={attemptNumber} />
        ) : phase === 'classicalTesting' ? (
          <motion.div
            key="classicalTesting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-10 text-center"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">{ATTEMPT_LABELS[attemptNumber]?.kicker}</p>
            <div className="relative flex h-72 w-72 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-black/70 shadow-2xl shadow-black/60 sm:h-80 sm:w-80">
              <MoleculeDiagram
                composition={pendingCandidate || EMPTY_COUNTS}
                seedKey={`attempt-${attemptNumber}`}
                mode="scanning"
                size="workspace"
              />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent"
                initial={{ top: '0%' }}
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div>
              <p className="font-mono text-lg text-cyan-200">{pendingCandidate?.formula}</p>
              <p className="mt-2 text-sm text-slate-400">Mission Control is analyzing your candidate...</p>
            </div>
          </motion.div>
        ) : phase === 'failure' ? (
          <motion.div
            key="failure"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-10 text-center"
          >
            <div className="relative flex h-72 w-72 items-center justify-center overflow-hidden rounded-2xl border border-red-500/30 bg-black/70 shadow-2xl shadow-black/60 sm:h-80 sm:w-80">
              <MoleculeDiagram
                composition={pendingCandidate || EMPTY_COUNTS}
                seedKey={`attempt-${attemptNumber}`}
                mode={FAILURE_LINES[failureLineIndex]?.mode || 'destabilizing'}
                size="workspace"
              />
            </div>
            <div className="min-h-16 space-y-1 font-mono">
              {FAILURE_LINES.slice(0, failureLineIndex + 1).map((line) => (
                <motion.p
                  key={line.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-sm text-red-300"
                >
                  {line.text}
                </motion.p>
              ))}
            </div>
          </motion.div>
        ) : phase === 'transition' ? (
          <TransitionPhase key="transition" attemptHistory={attemptHistory} onComplete={() => setPhase('searching')} />
        ) : phase === 'searching' ? (
          <SearchingPhase
            key="searching"
            tried={attemptHistory}
            onComplete={handleSearchComplete}
            onProgress={setSearchFrac}
            target={target}
            targetScore={targetScore}
          />
        ) : phase === 'statistics' ? (
          <StatisticsPhase key="statistics" searchResult={searchResult} targetName={targetName} onContinue={() => setPhase('debrief')} />
        ) : phase === 'debrief' ? (
          <DebriefPhase
            key="debrief"
            onContinue={() => setPhase('grounding')}
            target={target}
            targetScore={targetScore}
            targetName={targetName}
            attemptHistory={attemptHistory}
          />
        ) : (
          <GroundingPhase key="grounding" onReplay={handleReplay} />
        )}
      </AnimatePresence>
    </main>
  );
}

export default MoleculeMission;
