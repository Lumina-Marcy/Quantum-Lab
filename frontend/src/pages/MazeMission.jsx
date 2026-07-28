import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import QuantumCore from '../components/QuantumCore';
import SequentialLines from '../components/SequentialLines';
import ProgressBar from '../components/ProgressBar';
import {
  MAZE_SIZE,
  TOTAL_CELLS,
  TIMER_SECONDS,
  MOVE_COOLDOWN_MS,
  REPLAY_STEP_MS,
  DELTAS,
  cellKey,
  generateMaze,
  createTokens,
  stepTokens,
  computeWalkGrade,
} from '../utils/mazeData';

const INTRO_LINES = [
  "> No map. Just a start, and an exit beacon you can already see through the fog.",
  "> You're one qubit — but every junction splits you into one branch per path forward, all under the same controls.",
  "> Cover as much of the maze as you can, in as few shared moves as you can, until one branch finds the exit.",
];

const ACTIVE_PHASES = ['walking'];

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

function makeInitialMaze() {
  return generateMaze(MAZE_SIZE);
}

function Cell({ cell, isExit, isRevealed, tokensHere, isReplayMarker }) {
  if (!isRevealed) {
    return (
      <div className="relative aspect-square bg-slate-950">
        {isExit && (
          <span className="absolute inset-0 flex items-center justify-center text-[0.55rem] opacity-30 sm:text-xs">
            🏁
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
        <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] sm:text-xs">🏁</span>
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

function DirectionPad({ onMove, disabled }) {
  return (
    <div className="grid w-40 grid-cols-3 grid-rows-2 gap-1.5">
      <div />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMove('N')}
        className="rounded-lg bg-slate-800 py-2 text-lg text-slate-200 hover:bg-slate-700 disabled:opacity-40"
      >
        ↑
      </button>
      <div />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMove('W')}
        className="rounded-lg bg-slate-800 py-2 text-lg text-slate-200 hover:bg-slate-700 disabled:opacity-40"
      >
        ←
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMove('S')}
        className="rounded-lg bg-slate-800 py-2 text-lg text-slate-200 hover:bg-slate-700 disabled:opacity-40"
      >
        ↓
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMove('E')}
        className="rounded-lg bg-slate-800 py-2 text-lg text-slate-200 hover:bg-slate-700 disabled:opacity-40"
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
            className="rounded-xl border border-cyan-500/30 bg-slate-900/90 px-4 py-3 text-center font-mono text-xs leading-relaxed text-cyan-200 shadow-lg"
          >
            {toast.text}
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

function SearchGradePanel({ resolution }) {
  const grade = computeWalkGrade(
    resolution.steps,
    resolution.parSteps,
    resolution.coverageRatio,
    resolution.timeRemainingRatio
  );

  return (
    <div className={`mx-auto mb-8 max-w-md rounded-2xl border p-6 ${grade.cls}`}>
      <p className="text-center text-xs uppercase tracking-widest opacity-80">Search Efficiency Score</p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <span className="text-5xl font-bold leading-none">{grade.grade}</span>
        <span className="text-2xl font-semibold tabular-nums">{grade.percentage}%</span>
      </div>
      <p className="mt-1 text-center text-sm font-semibold">{grade.label}</p>
      <p className="mt-3 text-center text-[11px] leading-relaxed opacity-80">
        Weighted by how much of the maze your branches covered ({resolution.coveragePercent}%), how few shared-control
        steps it took, and how much of the shared clock you had left.
      </p>
    </div>
  );
}

function ConceptRecap({ stats, coveragePercent, cellsCovered }) {
  const items = [
    { key: 'splits', label: 'Junction splits', value: stats.splits },
    { key: 'locks', label: 'Branches locked (dead ends)', value: stats.locks },
    { key: 'cellsCovered', label: 'Cells covered', value: cellsCovered },
    { key: 'coveragePercent', label: 'Maze coverage', value: `${coveragePercent}%` },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.key} className="rounded-xl bg-slate-900/60 p-3">
          <p className="text-lg font-semibold text-cyan-200">{it.value}</p>
          <p className="mt-1 text-[11px] leading-snug text-slate-400">{it.label}</p>
        </div>
      ))}
    </div>
  );
}

function ResolutionScreen({ resolution, onReplay }) {
  const { won, steps, coveragePercent, cellsCovered, conceptStats } = resolution;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-widest text-cyan-400/80">{won ? 'Exit Found' : 'Time Expired'}</p>
      <h1 className="mt-2 text-3xl font-bold text-white">
        {won ? `Found It In ${steps} Steps` : 'The Search Ran Out Of Time'}
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        {won
          ? `One branch reached the exit after ${steps} shared-control steps, covering ${coveragePercent}% of the maze (${cellsCovered} cells) along the way.`
          : 'The clock hit zero before any branch reached the exit. Ground your branches never covered stays fog forever — the same wall a classical search hits, just distributed across whatever branches you kept alive.'}
      </p>

      <SearchGradePanel resolution={resolution} />

      <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-left">
        <p className="text-sm font-semibold text-cyan-300">How this actually works</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Walking one corridor at a time and backtracking on dead ends is classical search — worst case, you'd visit
          close to every one of this maze's <strong>{TOTAL_CELLS} cells</strong> before finding the exit. Every
          junction you hit instead split your qubit into one branch per path, all advancing <em>simultaneously</em>{' '}
          under the same shared controls instead of one at a time — the same trick that lets quantum walks explore a
          search space in parallel instead of serially.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Every mechanic in this run — a junction splitting your qubit, a dead-end branch locking in place for good,
          and the single branch that reached the exit collapsing every other branch away and replaying as one
          classical path — is the same machinery behind quantum search, not just flavor text: superposition,
          decoherence, and measurement. Mission 3 uses this exact same machinery to search millions of molecular
          structures for a cure. This maze is the mechanism; that mission is the payoff.
        </p>
        <ConceptRecap stats={conceptStats} coveragePercent={coveragePercent} cellsCovered={cellsCovered} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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

const EMPTY_CONCEPT_STATS = { splits: 0, locks: 0 };

function makeInitialVisited(maze) {
  return new Set([cellKey(maze.start.row, maze.start.col)]);
}

function MazeMission() {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'walking' | 'replaying' | 'resolved'
  const [maze, setMaze] = useState(makeInitialMaze);

  const [tokens, setTokens] = useState(() => createTokens(maze));
  const [visited, setVisited] = useState(() => makeInitialVisited(maze));
  const [stepCount, setStepCount] = useState(0);

  const [winnerPath, setWinnerPath] = useState(null);
  const [replayIndex, setReplayIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [resolution, setResolution] = useState(null);
  const [toast, setToast] = useState(null);
  const [conceptStats, setConceptStats] = useState(EMPTY_CONCEPT_STATS);

  const lastMoveRef = useRef(0);
  const handlersRef = useRef({});
  const seenConceptsRef = useRef(new Set());
  const toastTimeoutRef = useRef(null);

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

  function finish(won, steps) {
    const timeRemainingRatio = timeLeft / TIMER_SECONDS;
    const coverageRatio = visited.size / TOTAL_CELLS;
    setResolution({
      won,
      steps,
      coverageRatio,
      coveragePercent: Math.round(coverageRatio * 100),
      cellsCovered: visited.size,
      parSteps: maze.parSteps,
      timeRemainingRatio,
      conceptStats,
    });
    setPhase('resolved');
  }

  function attemptMove(dirKey) {
    if (phase !== 'walking') return;
    const now = performance.now();
    if (now - lastMoveRef.current < MOVE_COOLDOWN_MS) return;

    const result = stepTokens(maze, tokens, dirKey);
    if (!result.moved) return;
    lastMoveRef.current = now;

    setTokens(result.tokens);
    setVisited((prev) => {
      const next = new Set(prev);
      result.newlyVisited.forEach((k) => next.add(k));
      return next;
    });
    setStepCount((c) => c + 1);

    if (result.splits > 0) {
      bumpStat('splits', result.splits);
      announce('superposition');
    }
    if (result.locks > 0) {
      bumpStat('locks', result.locks);
      announce('decoherence');
    }

    if (result.winner) {
      setWinnerPath(result.winner.path);
      announce('measurement');
      setReplayIndex(0);
      setPhase('replaying');
    }
  }

  handlersRef.current = { attemptMove };

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

  useEffect(() => {
    if (!ACTIVE_PHASES.includes(phase)) return;
    const id = setInterval(() => setTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (ACTIVE_PHASES.includes(phase) && timeLeft <= 0) {
      finish(false, stepCount);
    }
    // stepCount/visited/maze read at the instant time runs out, not tracked as triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  // Solo replay: once a branch reaches the exit, walk its recorded lineage one cell at a time.
  useEffect(() => {
    if (phase !== 'replaying' || !winnerPath) return;
    if (replayIndex >= winnerPath.length - 1) {
      const timeout = setTimeout(() => finish(true, stepCount), 500);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setReplayIndex((i) => i + 1), REPLAY_STEP_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, winnerPath, replayIndex]);

  function handleIntroComplete() {
    setTimeout(() => setPhase('walking'), 600);
  }

  function replay() {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    const nextMaze = makeInitialMaze();
    setMaze(nextMaze);
    setTokens(createTokens(nextMaze));
    setVisited(makeInitialVisited(nextMaze));
    setStepCount(0);
    setWinnerPath(null);
    setReplayIndex(0);
    setTimeLeft(TIMER_SECONDS);
    setResolution(null);
    setToast(null);
    setConceptStats(EMPTY_CONCEPT_STATS);
    seenConceptsRef.current = new Set();
    setPhase('walking');
  }

  const activeBranches = useMemo(() => tokens.filter((t) => !t.locked).length, [tokens]);
  const coveragePercent = useMemo(() => Math.round((visited.size / TOTAL_CELLS) * 100), [visited]);
  const replayPos = phase === 'replaying' && winnerPath ? winnerPath[Math.min(replayIndex, winnerPath.length - 1)] : null;

  function renderMazeGrid() {
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
          const isReplayMarker = !!replayPos && replayPos.row === cell.row && replayPos.col === cell.col;
          const isRevealed = visited.has(key) || isReplayMarker;
          const cellTokens = tokens.filter(
            (t) => t.row === cell.row && t.col === cell.col && (phase === 'walking' || t.locked)
          );

          return (
            <Cell
              key={key}
              cell={cell}
              isExit={isExit}
              isRevealed={isRevealed}
              tokensHere={cellTokens}
              isReplayMarker={isReplayMarker}
            />
          );
        })}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="flex items-center justify-center gap-2 border-b border-slate-800/60 py-3">
        <QuantumCore stage="alive" className="h-5 w-5" particleCount={5} detail="minimal" />
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
        ) : phase === 'walking' ? (
          <motion.div
            key="walking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-4xl px-6 py-10"
          >
            <ConceptToast toast={toast} />

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
                <p className="mt-1 text-[11px] text-slate-500">Active branches: {activeBranches}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Maze Coverage</p>
                <p className="mt-1 text-lg font-semibold text-purple-200">{coveragePercent}%</p>
                <div className="mt-2">
                  <ProgressBar value={coveragePercent} gradient="from-purple-500 to-cyan-300" duration={0.3} />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
              {renderMazeGrid()}

              <div className="flex flex-col items-center gap-4">
                <DirectionPad onMove={attemptMove} disabled={phase !== 'walking'} />

                <p className="max-w-[220px] text-center text-xs text-slate-500">
                  Arrow keys / WASD — every direction press moves every branch committed to that direction at once.
                  Junctions split you further; dead ends lock a branch in place for good.
                </p>
              </div>
            </div>

            <ConceptLegend />
          </motion.div>
        ) : phase === 'replaying' ? (
          <motion.div
            key="replaying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-10"
          >
            <p className="font-mono text-sm text-cyan-300">
              &gt; Measurement made — replaying the winning branch's path start to finish...
            </p>
            {renderMazeGrid()}
          </motion.div>
        ) : (
          <motion.div key="resolved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <ResolutionScreen resolution={resolution} onReplay={replay} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default MazeMission;
