import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Flag } from 'lucide-react';
import QuantumCore from '../components/QuantumCore';
import Panel from '../components/Panel';
import SequentialLines from '../components/SequentialLines';
import ProgressBar from '../components/ProgressBar';
import {
  MAZE_SIZE,
  TOTAL_CELLS,
  TIMER_SECONDS,
  MOVE_COOLDOWN_MS,
  REPLAY_STEP_MS,
  cellKey,
  generateMaze,
  createTokens,
  stepTokens,
  stepClassical,
  computeWalkGrade,
  CLASSICAL_SCORE_WEIGHTS,
} from '../utils/mazeData';

const INTRO_LINES = [
  "> No map. Just a start, and an exit beacon you can already see through the fog.",
  "> Right now you're just you — one position, real walls, no shortcuts. Find the exit however you can.",
  "> However many wrong turns it takes along the way, that's what a search costs when nothing's split in parallel.",
];

const QUANTUM_INTRO_LINES = [
  "> Same kind of maze, brand new layout — but you're not walking this one alone.",
  "> You're one qubit now. Every junction splits you into one branch per path forward, all under the same shared controls.",
  "> Cover as much of the maze as you can, in as few shared moves as you can, until one branch finds the exit.",
];

const KEY_TO_DIR = {
  ArrowUp: 'N', w: 'N', W: 'N',
  ArrowDown: 'S', s: 'S', S: 'S',
  ArrowLeft: 'W', a: 'W', A: 'W',
  ArrowRight: 'E', d: 'E', D: 'E',
};

const CONCEPT_MESSAGES = {
  superposition:
    "> That junction just split your qubit — one branch per path forward, all exploring at once under the same shared controls. That's superposition: parallel exploration, not picking one way and hoping.",
  decoherence:
    "> A branch just hit a genuine dead end and locked in place — that outcome's probability just dropped to zero. It stays on the map as ground you covered; it just can't go anywhere from here.",
  measurement:
    "> One branch just reached the exit — that's the measurement. Every other branch collapses away, and the maze now replays that single lineage's path: the classical answer a measurement collapses down to.",
};

const EMPTY_CONCEPT_STATS = { splits: 0, locks: 0 };

function makeInitialMaze() {
  return generateMaze(MAZE_SIZE);
}

function makeInitialVisited(maze) {
  return new Set([cellKey(maze.start.row, maze.start.col)]);
}

function Cell({ cell, isExit, isRevealed, tokensHere, isReplayMarker }) {
  if (!isRevealed) {
    return (
      <div className="relative aspect-square bg-slate-950">
        {isExit && (
          <span className="absolute inset-0 flex items-center justify-center opacity-30">
            <Flag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </span>
        )}
      </div>
    );
  }

  const wallColor = '#475569';
  const style = {
    borderStyle: 'solid',
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopColor: cell.walls.N ? wallColor : 'transparent',
    borderBottomColor: cell.walls.S ? wallColor : 'transparent',
    borderLeftColor: cell.walls.W ? wallColor : 'transparent',
    borderRightColor: cell.walls.E ? wallColor : 'transparent',
  };

  const hasLocked = tokensHere.some((t) => t.locked);
  const tintClass = isExit ? 'bg-emerald-500/10' : hasLocked ? 'bg-rose-950/40' : 'bg-slate-900/60';

  return (
    <div style={style} className={`relative aspect-square ${tintClass} transition-colors duration-300`}>
      {isExit && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Flag className="h-3.5 w-3.5" />
        </span>
      )}

      {tokensHere.map((t) => (
        <motion.div
          key={t.id}
          animate={t.locked ? { opacity: 0.55 } : { opacity: [0.35, 0.9, 0.35] }}
          transition={t.locked ? { duration: 0.3 } : { duration: 0.8, repeat: Infinity }}
          className={`absolute inset-[30%] rounded-full ${t.locked ? 'bg-rose-500/80' : 'bg-cyan-300'}`}
        />
      ))}
      {tokensHere.length > 1 && (
        <span className="absolute bottom-0 right-0 px-1 text-[0.6rem] font-semibold leading-tight text-cyan-200">
          {tokensHere.length}
        </span>
      )}

      {isReplayMarker && (
        <motion.span
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-[15%] rounded-sm bg-cyan-300 shadow-[0_0_10px_2px_rgba(34,211,238,0.65)]"
        />
      )}
    </div>
  );
}

function renderGrid({ maze, visited, tokens = [], markerPos = null }) {
  return (
    <div
      className="grid overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-slate-800"
      style={{
        gridTemplateColumns: `repeat(${maze.size}, minmax(0, 1fr))`,
        width: 'min(92vw, 520px)',
        gap: '1px',
      }}
    >
      {maze.cells.flat().map((cell) => {
        const key = cellKey(cell.row, cell.col);
        const isExit = maze.exit.row === cell.row && maze.exit.col === cell.col;
        const isMarker = !!markerPos && markerPos.row === cell.row && markerPos.col === cell.col;
        const isRevealed = visited.has(key) || isMarker;
        const cellTokens = tokens.filter((t) => t.row === cell.row && t.col === cell.col);

        return (
          <Cell
            key={key}
            cell={cell}
            isExit={isExit}
            isRevealed={isRevealed}
            tokensHere={cellTokens}
            isReplayMarker={isMarker}
          />
        );
      })}
    </div>
  );
}

function DirectionPad({ onMove, disabled }) {
  return (
    <div className="grid w-40 grid-cols-3 grid-rows-2 gap-1.5">
      <div />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMove('N')}
        {...hoverProps}
        className="rounded-lg bg-white/[0.04] py-2 text-lg text-slate-200 hover:bg-white/[0.08] disabled:opacity-40"
      >
        ↑
      </button>
      <div />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMove('W')}
        {...hoverProps}
        className="rounded-lg bg-white/[0.04] py-2 text-lg text-slate-200 hover:bg-white/[0.08] disabled:opacity-40"
      >
        ←
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMove('S')}
        {...hoverProps}
        className="rounded-lg bg-white/[0.04] py-2 text-lg text-slate-200 hover:bg-white/[0.08] disabled:opacity-40"
      >
        ↓
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMove('E')}
        {...hoverProps}
        className="rounded-lg bg-white/[0.04] py-2 text-lg text-slate-200 hover:bg-white/[0.08] disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

function ConceptToast({ toast }) {
  return (
    <div className="mx-auto mb-4 max-w-xl px-2">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Panel className="px-4 py-3 text-center font-mono text-xs leading-relaxed text-cyan-200">
              {toast.text}
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConceptLegend() {
  const items = [
    { swatch: 'bg-cyan-300 animate-pulse', label: 'Active qubit branch' },
    { swatch: 'bg-rose-500/80', label: 'Locked — hit a dead end' },
    { swatch: 'bg-slate-700', label: 'Exit beacon (position known, route not)' },
  ];
  return (
    <div className="mx-auto mt-4 flex max-w-lg flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-slate-500">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${it.swatch}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function StatCards({ timeLeft, stepCount, coveragePercent, stepsExtra }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Time Remaining</p>
        <p className="mt-1 text-lg font-semibold text-white">{timeLeft}s</p>
        <div className="mt-2">
          <ProgressBar
            value={(timeLeft / TIMER_SECONDS) * 100}
            gradient={timeLeft <= TIMER_SECONDS * 0.25 ? 'from-red-600 to-red-400' : 'from-amber-500 to-amber-300'}
            duration={0.4}
          />
        </div>
      </div>
      <div className="rounded-2xl bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Steps Taken</p>
        <p className="mt-1 text-lg font-semibold text-cyan-200">{stepCount}</p>
        {stepsExtra && <p className="mt-1 text-[11px] text-slate-500">{stepsExtra}</p>}
      </div>
      <div className="rounded-2xl bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Maze Coverage</p>
        <p className="mt-1 text-lg font-semibold text-purple-200">{coveragePercent}%</p>
        <div className="mt-2">
          <ProgressBar value={coveragePercent} gradient="from-purple-500 to-cyan-300" duration={0.3} />
        </div>
      </div>
    </div>
  );
}

function SearchGradePanel({ resolution }) {
  const grade = computeWalkGrade(
    resolution.steps,
    resolution.parSteps,
    resolution.coverageRatio,
    resolution.timeRemainingRatio,
    resolution.weights
  );

  return (
    <div className="mx-auto mb-10 max-w-md text-center">
      <p className="text-xs uppercase tracking-widest text-slate-500">Search Efficiency Score</p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <span className={`font-display text-6xl font-bold leading-none ${grade.cls}`}>{grade.grade}</span>
        <span className="text-2xl font-semibold tabular-nums text-slate-300">{grade.percentage}%</span>
      </div>
      <p className="mt-1 text-center text-sm font-semibold">{grade.label}</p>
      <p className="mt-3 text-center text-[11px] leading-relaxed opacity-80">
        Weighted by how much of the maze you covered ({resolution.coveragePercent}%), how few steps it took, and how
        much of the clock you had left.
      </p>
    </div>
  );
}

function StatRecap({ title, items }) {
  return (
    <div className="mt-6">
      {title && <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>}
      <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.key} className="rounded-xl bg-slate-900/60 p-3">
            <p className="text-lg font-semibold text-cyan-200">{it.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">{it.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassicalResolutionScreen({ resolution, onContinue }) {
  const { won, steps, coveragePercent, cellsCovered } = resolution;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-widest text-cyan-400/80">
        {won ? 'Exit Found — Solo' : 'Time Expired — Solo'}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">
        {won ? `Found It In ${steps} Steps, Alone` : 'The Solo Search Ran Out Of Time'}
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
        {won
          ? `No splitting, no shortcuts — just you, backtracking out of every wrong turn, covering ${coveragePercent}% of the maze (${cellsCovered} cells) along the way.`
          : `The clock hit zero before you found the exit on your own. Whatever ground you covered — ${coveragePercent}% of the maze — is locked in below.`}
      </p>

      <SearchGradePanel resolution={resolution} />

      <p className="text-sm text-slate-400">
        Now you get a qubit that splits at every junction. Same kind of problem, a very different way through it.
      </p>

      <div className="mt-8 flex items-center justify-center">
        <button
          onClick={onContinue}
          className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Begin Quantum Phase →
        </button>
      </div>
    </div>
  );
}

function FinalResolutionScreen({ classicalResolution, quantumResolution, onReplay }) {
  const won = quantumResolution.won;

  const classicalStatItems = [
    { key: 'steps', label: 'Steps taken (solo)', value: classicalResolution.steps },
    { key: 'deadEnds', label: 'Dead ends entered', value: classicalResolution.deadEndsEntered },
    { key: 'cellsCovered', label: 'Cells covered', value: classicalResolution.cellsCovered },
    { key: 'coveragePercent', label: 'Maze coverage', value: `${classicalResolution.coveragePercent}%` },
  ];
  const quantumStatItems = [
    { key: 'splits', label: 'Junction splits', value: quantumResolution.conceptStats.splits },
    { key: 'locks', label: 'Branches locked (dead ends)', value: quantumResolution.conceptStats.locks },
    { key: 'cellsCovered', label: 'Cells covered', value: quantumResolution.cellsCovered },
    { key: 'coveragePercent', label: 'Maze coverage', value: `${quantumResolution.coveragePercent}%` },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-widest text-cyan-400/80">
        {won ? 'Exit Found — Both Runs Complete' : 'Time Expired'}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">
        {won
          ? `Solo: ${classicalResolution.steps} Steps · Quantum: ${quantumResolution.steps} Steps`
          : 'The Quantum Search Ran Out Of Time'}
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        First you searched blind — {classicalResolution.steps} steps, {classicalResolution.coveragePercent}% of the
        maze, {classicalResolution.deadEndsEntered} dead ends walked into and back out of. Then the same kind of
        problem, solved with a qubit that splits at every junction:{' '}
        {won
          ? `${quantumResolution.steps} shared-control steps, ${quantumResolution.coveragePercent}% covered, one branch measuring the exit.`
          : 'time ran out before any branch reached the exit.'}
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">Solo Run</p>
          <SearchGradePanel resolution={classicalResolution} />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">Quantum Run</p>
          <SearchGradePanel resolution={quantumResolution} />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-left">
        <p className="text-sm font-semibold text-cyan-300">How this actually works</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Walking one corridor at a time and backtracking on dead ends is classical search — that's what your solo run
          just was. Every junction in the quantum run instead split your qubit into one branch per path, all advancing{' '}
          <em>simultaneously</em> under the same shared controls instead of one at a time — the same trick that lets
          quantum walks explore a search space in parallel instead of serially.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Every mechanic in the quantum run — a junction splitting your qubit, a dead-end branch locking in place for
          good, and the single branch that reached the exit collapsing every other branch away and replaying as one
          classical path — is the same machinery behind quantum search, not just flavor text: superposition,
          decoherence, and measurement. Mission 1 uses this exact same machinery to search millions of molecular
          structures for a cure. This maze is the mechanism; that mission is the payoff.
        </p>
        <StatRecap title="Solo Run" items={classicalStatItems} />
        <StatRecap title="Quantum Run" items={quantumStatItems} />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onReplay} className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
          Run It Back
        </button>
        <Link
          to="/mission/2"
          className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Finish Mission
        </Link>
      </div>
    </div>
  );
}

function MazeMission() {
  // 'intro' | 'classical-walking' | 'classical-resolved' | 'quantum-intro' | 'quantum-walking' | 'comparison' | 'resolved'
  const [phase, setPhase] = useState('intro');

  // Classical (solo) run
  const [classicalMaze, setClassicalMaze] = useState(makeInitialMaze);
  const [classicalPos, setClassicalPos] = useState(() => ({ ...classicalMaze.start }));
  const [classicalVisited, setClassicalVisited] = useState(() => makeInitialVisited(classicalMaze));
  const [classicalHistory, setClassicalHistory] = useState(() => [{ ...classicalMaze.start }]);
  const [classicalStepCount, setClassicalStepCount] = useState(0);
  const [classicalTimeLeft, setClassicalTimeLeft] = useState(TIMER_SECONDS);
  const [classicalResolution, setClassicalResolution] = useState(null);

  // Quantum (splitting) run
  const [quantumMaze, setQuantumMaze] = useState(makeInitialMaze);
  const [quantumTokens, setQuantumTokens] = useState(() => createTokens(quantumMaze));
  const [quantumVisited, setQuantumVisited] = useState(() => makeInitialVisited(quantumMaze));
  const [quantumStepCount, setQuantumStepCount] = useState(0);
  const [quantumTimeLeft, setQuantumTimeLeft] = useState(TIMER_SECONDS);
  const [quantumResolution, setQuantumResolution] = useState(null);
  const [winnerPath, setWinnerPath] = useState(null);
  const [conceptStats, setConceptStats] = useState(EMPTY_CONCEPT_STATS);

  // Side-by-side comparison replay
  const [comparisonClassicalIndex, setComparisonClassicalIndex] = useState(0);
  const [comparisonQuantumIndex, setComparisonQuantumIndex] = useState(0);

  const [toast, setToast] = useState(null);

  const lastMoveRef = useRef(0);
  const handlersRef = useRef({});
  const seenConceptsRef = useRef(new Set());
  const toastTimeoutRef = useRef(null);

  // The Core is this mission's companion and its progress indicator at once: a hover lift on the
  // direction pad, a blue pulse when a branch reaches the exit, a brief destabilize when one
  // dead-ends, and a coarse intensity arc that climbs with maze coverage and lands on a final
  // state reflecting the search's efficiency grade.
  const [coreStage, setCoreStage] = useState('alive');
  const [hoveredActionable, setHoveredActionable] = useState(false);
  const corePulse = useMotionValue(0);
  const pulseScale = useTransform(corePulse, [0, 1], [0.4, 2.2]);
  const pulseOpacity = useTransform(corePulse, [0, 0.15, 1], [0, 0.55, 0]);
  const coreProgress = useMotionValue(0.3);

  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  function bumpStat(key, amount = 1) {
    setConceptStats((s) => ({ ...s, [key]: s[key] + amount }));
  }

  function announce(conceptKey) {
    if (seenConceptsRef.current.has(conceptKey)) return;
    seenConceptsRef.current.add(conceptKey);
    setToast({ id: conceptKey, text: CONCEPT_MESSAGES[conceptKey] });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 6500);
  }

  function resetClassical(nextMaze) {
    setClassicalMaze(nextMaze);
    setClassicalPos({ ...nextMaze.start });
    setClassicalVisited(makeInitialVisited(nextMaze));
    setClassicalHistory([{ ...nextMaze.start }]);
    setClassicalStepCount(0);
    setClassicalTimeLeft(TIMER_SECONDS);
    setClassicalResolution(null);
  }

  function resetQuantum(nextMaze) {
    setQuantumMaze(nextMaze);
    setQuantumTokens(createTokens(nextMaze));
    setQuantumVisited(makeInitialVisited(nextMaze));
    setQuantumStepCount(0);
    setQuantumTimeLeft(TIMER_SECONDS);
    setQuantumResolution(null);
    setWinnerPath(null);
    setConceptStats(EMPTY_CONCEPT_STATS);
    seenConceptsRef.current = new Set();
    setToast(null);
  }

  // Both finish* helpers take the values a move just produced explicitly, rather than reading
  // component state — the caller's own setState calls for that same move haven't flushed into a
  // render yet, so the closed-over state variables would still read last render's values.
  function finishClassical(won, { visited, history, steps, timeLeft }) {
    const coverageRatio = visited.size / TOTAL_CELLS;
    const deadEndsEntered = new Set(
      history.filter((p) => classicalMaze.cells[p.row][p.col].isDeadEnd).map((p) => cellKey(p.row, p.col))
    ).size;
    setClassicalResolution({
      won,
      steps,
      coverageRatio,
      coveragePercent: Math.round(coverageRatio * 100),
      cellsCovered: visited.size,
      parSteps: classicalMaze.optimalSteps,
      timeRemainingRatio: timeLeft / TIMER_SECONDS,
      deadEndsEntered,
      weights: CLASSICAL_SCORE_WEIGHTS,
    });
  }

  function finishQuantum(won, { visited, steps, timeLeft, conceptStats: statsAtFinish }) {
    const coverageRatio = visited.size / TOTAL_CELLS;
    setQuantumResolution({
      won,
      steps,
      coverageRatio,
      coveragePercent: Math.round(coverageRatio * 100),
      cellsCovered: visited.size,
      parSteps: quantumMaze.parSteps,
      timeRemainingRatio: timeLeft / TIMER_SECONDS,
      conceptStats: statsAtFinish,
    });
  }

  function attemptClassicalMove(dirKey) {
    if (phase !== 'classical-walking') return;
    const now = performance.now();
    if (now - lastMoveRef.current < MOVE_COOLDOWN_MS) return;

    const result = stepClassical(classicalMaze, classicalPos, dirKey);
    if (!result.moved) return;
    lastMoveRef.current = now;

    const nextPos = { row: result.row, col: result.col };
    const nextVisited = new Set(classicalVisited);
    nextVisited.add(cellKey(nextPos.row, nextPos.col));
    const nextHistory = [...classicalHistory, nextPos];
    const nextStepCount = classicalStepCount + 1;

    setClassicalPos(nextPos);
    setClassicalVisited(nextVisited);
    setClassicalHistory(nextHistory);
    setClassicalStepCount(nextStepCount);

    const won = nextPos.row === classicalMaze.exit.row && nextPos.col === classicalMaze.exit.col;
    if (won) {
      finishClassical(true, {
        visited: nextVisited,
        history: nextHistory,
        steps: nextStepCount,
        timeLeft: classicalTimeLeft,
      });
      setPhase('classical-resolved');
    }
  }

  function attemptQuantumMove(dirKey) {
    if (phase !== 'quantum-walking') return;
    const now = performance.now();
    if (now - lastMoveRef.current < MOVE_COOLDOWN_MS) return;

    const result = stepTokens(quantumMaze, quantumTokens, dirKey);
    if (!result.moved) return;
    lastMoveRef.current = now;

    const nextVisited = new Set(quantumVisited);
    result.newlyVisited.forEach((k) => nextVisited.add(k));
    const nextStepCount = quantumStepCount + 1;

    setQuantumTokens(result.tokens);
    setQuantumVisited(nextVisited);
    setQuantumStepCount(nextStepCount);

    let nextConceptStats = conceptStats;
    if (result.splits > 0) {
      nextConceptStats = { ...nextConceptStats, splits: nextConceptStats.splits + result.splits };
      setConceptStats(nextConceptStats);
      announce('superposition');
    }
    if (result.locks > 0) {
      nextConceptStats = { ...nextConceptStats, locks: nextConceptStats.locks + result.locks };
      setConceptStats(nextConceptStats);
      announce('decoherence');
      setCoreStage('unstable');
      setTimeout(() => setCoreStage((s) => (s === 'unstable' ? 'alive' : s)), 1400);
    }

    if (result.winner) {
      announce('measurement');
      setWinnerPath(result.winner.path);
      finishQuantum(true, {
        visited: nextVisited,
        steps: nextStepCount,
        timeLeft: quantumTimeLeft,
        conceptStats: nextConceptStats,
      });
      setComparisonClassicalIndex(0);
      setComparisonQuantumIndex(0);
      setPhase('comparison');
    }
  }

  handlersRef.current = {
    attemptMove: (dir) => {
      if (phase === 'classical-walking') attemptClassicalMove(dir);
      if (phase === 'quantum-walking') attemptQuantumMove(dir);
    },
  };

  useEffect(() => {
    function onKeyDown(e) {
      const dir = KEY_TO_DIR[e.key];
      if (dir) {
        e.preventDefault();
        handlersRef.current.attemptMove(dir);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Independent per-phase countdown timers.
  useEffect(() => {
    if (phase !== 'classical-walking') return;
    const id = setInterval(() => setClassicalTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'quantum-walking') return;
    const id = setInterval(() => setQuantumTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'classical-walking' && classicalTimeLeft <= 0) {
      finishClassical(false, {
        visited: classicalVisited,
        history: classicalHistory,
        steps: classicalStepCount,
        timeLeft: 0,
      });
      setPhase('classical-resolved');
    }
    // Read state as of the instant time runs out, not tracked as triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, classicalTimeLeft]);

  useEffect(() => {
    if (phase === 'quantum-walking' && quantumTimeLeft <= 0) {
      finishQuantum(false, { visited: quantumVisited, steps: quantumStepCount, timeLeft: 0, conceptStats });
      setPhase('resolved');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, quantumTimeLeft]);

  // Comparison replay: quantum side keeps today's original pace; classical side (usually a much
  // longer history, since every dead end costs a there-and-back) speeds up proportionally so it
  // doesn't leave the quantum panel sitting idle at the exit for a long stretch once it's done.
  useEffect(() => {
    if (phase !== 'comparison' || !winnerPath) return;
    if (comparisonQuantumIndex >= winnerPath.length - 1) return;
    const timeout = setTimeout(() => setComparisonQuantumIndex((i) => i + 1), REPLAY_STEP_MS);
    return () => clearTimeout(timeout);
  }, [phase, winnerPath, comparisonQuantumIndex]);

  useEffect(() => {
    if (phase !== 'comparison' || classicalHistory.length === 0) return;
    if (comparisonClassicalIndex >= classicalHistory.length - 1) return;
    const speedup = winnerPath ? winnerPath.length / classicalHistory.length : 1;
    const tickMs = Math.max(60, REPLAY_STEP_MS * speedup);
    const timeout = setTimeout(() => setComparisonClassicalIndex((i) => i + 1), tickMs);
    return () => clearTimeout(timeout);
  }, [phase, classicalHistory, comparisonClassicalIndex, winnerPath]);

  useEffect(() => {
    if (phase !== 'comparison' || !winnerPath) return;
    const classicalDone = comparisonClassicalIndex >= classicalHistory.length - 1;
    const quantumDone = comparisonQuantumIndex >= winnerPath.length - 1;
    if (!classicalDone || !quantumDone) return;
    const timeout = setTimeout(() => setPhase('resolved'), 700);
    return () => clearTimeout(timeout);
  }, [phase, comparisonClassicalIndex, comparisonQuantumIndex, winnerPath, classicalHistory]);

  // Coarse mission-long arc: dim during the intro, climbing with maze coverage through each walk,
  // a further lift once a branch is found and replaying, landing on the final efficiency grade.
  useEffect(() => {
    let target = 0.3;
    if (phase === 'classical-walking') {
      target = 0.3 + 0.6 * (classicalVisited.size / TOTAL_CELLS);
    } else if (phase === 'quantum-walking') {
      target = 0.3 + 0.6 * (quantumVisited.size / TOTAL_CELLS);
    } else if (phase === 'comparison') {
      target = 0.9;
    } else if (phase === 'resolved' && quantumResolution) {
      const grade = computeWalkGrade(
        quantumResolution.steps,
        quantumResolution.parSteps,
        quantumResolution.coverageRatio,
        quantumResolution.timeRemainingRatio
      );
      target = grade.percentage / 100;
      if (grade.grade === 'S' || grade.grade === 'A') setCoreStage('stabilizing');
    }
    const controls = animate(coreProgress, target, { duration: 1.2, ease: 'easeInOut' });
    return controls.stop;
  }, [phase, classicalVisited, quantumVisited, quantumResolution]);

  function handleIntroComplete() {
    setTimeout(() => setPhase('classical-walking'), 600);
  }

  function handleQuantumIntroComplete() {
    setTimeout(() => setPhase('quantum-walking'), 600);
  }

  function handleContinueToQuantum() {
    resetQuantum(makeInitialMaze());
    setPhase('quantum-intro');
  }

  function replay() {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    resetClassical(makeInitialMaze());
    resetQuantum(makeInitialMaze());
    setComparisonClassicalIndex(0);
    setComparisonQuantumIndex(0);
    setPhase('classical-walking');
  }

  const quantumActiveBranches = useMemo(() => quantumTokens.filter((t) => !t.locked).length, [quantumTokens]);
  const classicalCoveragePercent = useMemo(
    () => Math.round((classicalVisited.size / TOTAL_CELLS) * 100),
    [classicalVisited]
  );
  const quantumCoveragePercent = useMemo(
    () => Math.round((quantumVisited.size / TOTAL_CELLS) * 100),
    [quantumVisited]
  );

  const classicalReplayPos =
    phase === 'comparison' && classicalHistory.length > 0
      ? classicalHistory[Math.min(comparisonClassicalIndex, classicalHistory.length - 1)]
      : null;
  const quantumReplayPos =
    phase === 'comparison' && winnerPath ? winnerPath[Math.min(comparisonQuantumIndex, winnerPath.length - 1)] : null;

  return (
    <main className="min-h-screen bg-transparent">
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
          <QuantumCore stage={coreStage} progress={coreProgress} className="h-14 w-14" particleCount={10} />
        </motion.div>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Maze Search</span>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' ? (
          <motion.div
            key="intro"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-10"
          >
            <SequentialLines
              lines={INTRO_LINES}
              showCursor
              stagger={1.1}
              onComplete={handleIntroComplete}
              className="space-y-3 text-center"
              lineClassName="font-mono text-sm text-cyan-300 sm:text-base"
            />
          </motion.div>
        ) : phase === 'classical-walking' ? (
          <motion.div
            key="classical-walking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-4xl px-6 py-10"
          >
            <StatCards
              timeLeft={classicalTimeLeft}
              stepCount={classicalStepCount}
              coveragePercent={classicalCoveragePercent}
            />

            <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
              {renderGrid({
                maze: classicalMaze,
                visited: classicalVisited,
                tokens: [{ id: 'player', row: classicalPos.row, col: classicalPos.col, locked: false }],
              })}

              <div className="flex flex-col items-center gap-4">
                <DirectionPad onMove={attemptClassicalMove} disabled={phase !== 'classical-walking'} />

                <p className="max-w-[220px] text-center text-xs text-slate-500">
                  Arrow keys / WASD. No shortcuts here — hit a dead end, back out yourself.
                </p>
              </div>
            </div>
          </motion.div>
        ) : phase === 'classical-resolved' ? (
          <motion.div key="classical-resolved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <ClassicalResolutionScreen resolution={classicalResolution} onContinue={handleContinueToQuantum} />
          </motion.div>
        ) : phase === 'quantum-intro' ? (
          <motion.div
            key="quantum-intro"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-10"
          >
            <SequentialLines
              lines={QUANTUM_INTRO_LINES}
              showCursor
              stagger={1.1}
              onComplete={handleQuantumIntroComplete}
              className="space-y-3 text-center"
              lineClassName="font-mono text-sm text-cyan-300 sm:text-base"
            />
          </motion.div>
        ) : phase === 'quantum-walking' ? (
          <motion.div
            key="quantum-walking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-4xl px-6 py-10"
          >
            <ConceptToast toast={toast} />

            <StatCards
              timeLeft={quantumTimeLeft}
              stepCount={quantumStepCount}
              coveragePercent={quantumCoveragePercent}
              stepsExtra={`Active branches: ${quantumActiveBranches}`}
            />

            <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
              {renderGrid({ maze: quantumMaze, visited: quantumVisited, tokens: quantumTokens })}

              <div className="flex flex-col items-center gap-4">
                <DirectionPad onMove={attemptQuantumMove} disabled={phase !== 'quantum-walking'} />

                <p className="max-w-[220px] text-center text-xs text-slate-500">
                  Arrow keys / WASD — every direction press moves every branch committed to that direction at once.
                  Junctions split you further; dead ends lock a branch in place for good.
                </p>
              </div>
            </div>

            <ConceptLegend />
          </motion.div>
        ) : phase === 'comparison' ? (
          <motion.div
            key="comparison"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-10"
          >
            <p className="text-center font-mono text-sm text-cyan-300">
              &gt; Two runs, same shape of problem — your solo search on the left, the quantum measurement on the
              right.
            </p>
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-widest text-slate-500">Solo Search</p>
                {renderGrid({ maze: classicalMaze, visited: classicalVisited, markerPos: classicalReplayPos })}
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-widest text-slate-500">Quantum Search</p>
                {renderGrid({ maze: quantumMaze, visited: quantumVisited, markerPos: quantumReplayPos })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="resolved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <FinalResolutionScreen
              classicalResolution={classicalResolution}
              quantumResolution={quantumResolution}
              onReplay={replay}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default MazeMission;
