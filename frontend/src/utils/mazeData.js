// Data model + maze generation for the Maze Search mission.
//
// The mission fiction: dropped into a maze with no map, you control a single qubit. Every time it
// steps into a junction cell (more than one way forward), it doesn't pick a branch — it splits into
// one qubit per forward branch, all still under your one shared control scheme. Press a direction
// and every live qubit that's committed to that direction steps forward at once; the rest hold in
// place waiting for their own. That's a quantum walk: many branches explored in genuine parallel
// instead of one at a time. A branch that dead-ends decoheres — that qubit locks in place for good.
// The branch that actually reaches the exit is the one measurement "sees": once it arrives, the
// maze replays that single lineage's path start-to-finish on its own, the classical trace a
// measurement collapses down to. You're graded on how much of the maze your walk covered and how
// few shared-control steps it took to do it.
export const MAZE_SIZE = 13;
export const TOTAL_CELLS = MAZE_SIZE * MAZE_SIZE;

export const TIMER_SECONDS = 180;

// Minimum ms between two shared-control moves registering, so holding a key doesn't fire dozens of
// moves per second.
export const MOVE_COOLDOWN_MS = 110;

// Playback speed of the solo replay once the winning lineage's path is known.
export const REPLAY_STEP_MS = 220;

export const DIRECTIONS = ['N', 'S', 'E', 'W'];
export const DELTAS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
export const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };

function inBounds(row, col, size) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cellKey(row, col) {
  return `${row},${col}`;
}

/** Directions with no wall on `cell`, in no particular order. */
export function openDirections(cell) {
  return DIRECTIONS.filter((d) => !cell.walls[d]);
}

/**
 * Randomized iterative depth-first backtracker — produces a "perfect maze" (exactly one path
 * between any two cells, no loops). That property is what guarantees every dead-end branch a qubit
 * explores really is a dead end, and that exactly one lineage among however many splits happen ever
 * reaches the exit.
 */
function carveMaze(size) {
  const cells = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      row,
      col,
      walls: { N: true, S: true, E: true, W: true },
    }))
  );

  const visited = new Set([cellKey(0, 0)]);
  const stack = [{ row: 0, col: 0 }];
  const DIR_DELTAS = [
    { key: 'N', dr: -1, dc: 0, opposite: 'S' },
    { key: 'S', dr: 1, dc: 0, opposite: 'N' },
    { key: 'E', dr: 0, dc: 1, opposite: 'W' },
    { key: 'W', dr: 0, dc: -1, opposite: 'E' },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const candidates = shuffle(DIR_DELTAS).filter((d) => {
      const nr = current.row + d.dr;
      const nc = current.col + d.dc;
      return inBounds(nr, nc, size) && !visited.has(cellKey(nr, nc));
    });

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const dir = candidates[0];
    const next = { row: current.row + dir.dr, col: current.col + dir.dc };
    cells[current.row][current.col].walls[dir.key] = false;
    cells[next.row][next.col].walls[dir.opposite] = false;
    visited.add(cellKey(next.row, next.col));
    stack.push(next);
  }

  return cells;
}

export function openNeighbors(cells, row, col) {
  const size = cells.length;
  return openDirections(cells[row][col])
    .map((d) => {
      const [dr, dc] = DELTAS[d];
      return { row: row + dr, col: col + dc };
    })
    .filter((n) => inBounds(n.row, n.col, size));
}

/** BFS shortest (and, in a perfect maze, only) path from start to exit. */
function shortestPath(cells, start, exit) {
  const prev = new Map();
  const seen = new Set([cellKey(start.row, start.col)]);
  const queue = [start];

  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.row === exit.row && cur.col === exit.col) break;
    for (const n of openNeighbors(cells, cur.row, cur.col)) {
      const k = cellKey(n.row, n.col);
      if (seen.has(k)) continue;
      seen.add(k);
      prev.set(k, cur);
      queue.push(n);
    }
  }

  const path = [exit];
  let cur = exit;
  while (!(cur.row === start.row && cur.col === start.col)) {
    const p = prev.get(cellKey(cur.row, cur.col));
    if (!p) break; // unreachable — shouldn't happen for a perfect maze, but don't infinite-loop
    path.push(p);
    cur = p;
  }
  path.reverse();
  return path;
}

/**
 * The farthest any cell sits from `start`, in corridor steps. Used as the "par" step count for
 * grading: the theoretical floor on shared-control presses needed for the last living branch to
 * either reach the exit or its own dead end, if every press were spent on exactly the branch that
 * needed it. Real play always does a little worse than this since branches on different frontiers
 * often want different directions on the same press.
 */
function farthestDistance(cells, start) {
  const dist = new Map([[cellKey(start.row, start.col), 0]]);
  const queue = [start];
  let max = 0;

  while (queue.length > 0) {
    const cur = queue.shift();
    const d = dist.get(cellKey(cur.row, cur.col));
    max = Math.max(max, d);
    for (const n of openNeighbors(cells, cur.row, cur.col)) {
      const k = cellKey(n.row, n.col);
      if (dist.has(k)) continue;
      dist.set(k, d + 1);
      queue.push(n);
    }
  }

  return max;
}

/**
 * Builds a full maze: carves the layout, finds the one true route (for flavor/reference), and tags
 * every cell as either on that route or a genuine dead-end branch — driving cell tint once revealed.
 */
export function generateMaze(size = MAZE_SIZE) {
  const cells = carveMaze(size);
  const start = { row: 0, col: 0 };
  const exit = { row: size - 1, col: size - 1 };
  const path = shortestPath(cells, start, exit);
  const pathSet = new Set(path.map((c) => cellKey(c.row, c.col)));

  for (const row of cells) {
    for (const cell of row) {
      const isStartOrExit =
        (cell.row === start.row && cell.col === start.col) || (cell.row === exit.row && cell.col === exit.col);
      cell.onPath = pathSet.has(cellKey(cell.row, cell.col));
      cell.isDeadEnd = !isStartOrExit && !cell.onPath && openNeighbors(cells, cell.row, cell.col).length === 1;
    }
  }

  return {
    cells,
    start,
    exit,
    size,
    optimalSteps: path.length - 1,
    parSteps: farthestDistance(cells, start),
  };
}

/**
 * The starting superposition: one qubit at `maze.start`, already split into one child per open
 * direction if the start cell is itself a junction. Every active (non-locked) token always carries
 * exactly one `committedDir` — the single direction it will advance on next; a shared-control press
 * only moves tokens whose committedDir matches the pressed key.
 */
export function createTokens(maze) {
  const startCell = maze.cells[maze.start.row][maze.start.col];
  const openDirs = openDirections(startCell);
  const basePath = [{ row: maze.start.row, col: maze.start.col }];

  if (openDirs.length <= 1) {
    return [
      {
        id: 'q0',
        row: maze.start.row,
        col: maze.start.col,
        path: basePath,
        committedDir: openDirs[0] ?? null,
        locked: false,
      },
    ];
  }

  return openDirs.map((d) => ({
    id: `q0>${d}`,
    row: maze.start.row,
    col: maze.start.col,
    path: basePath,
    committedDir: d,
    locked: false,
  }));
}

/**
 * Advances every token whose committedDir matches the pressed key by one cell, then resolves each
 * mover's new cell: reached the exit (winner), a dead end (locks in place for good), a plain
 * corridor (keeps going, now committed to that one forward direction), or a junction (replaced by
 * one new child token per forward branch, each committed to a different direction). Tokens not
 * matching the pressed key, or already locked, pass through unchanged.
 */
export function stepTokens(maze, tokens, dirKey) {
  const nextTokens = [];
  const newlyVisited = new Set();
  let moved = false;
  let splits = 0;
  let locks = 0;
  let winner = null;

  for (const token of tokens) {
    if (token.locked || token.committedDir !== dirKey) {
      nextTokens.push(token);
      continue;
    }

    const cell = maze.cells[token.row][token.col];
    if (cell.walls[dirKey]) {
      nextTokens.push(token);
      continue;
    }

    moved = true;
    const [dr, dc] = DELTAS[dirKey];
    const row = token.row + dr;
    const col = token.col + dc;
    const path = [...token.path, { row, col }];
    newlyVisited.add(cellKey(row, col));

    if (row === maze.exit.row && col === maze.exit.col) {
      winner = { ...token, row, col, path, committedDir: null };
      nextTokens.push(winner);
      continue;
    }

    const nextCell = maze.cells[row][col];
    const backDir = OPPOSITE[dirKey];
    const forwardDirs = openDirections(nextCell).filter((d) => d !== backDir);

    if (forwardDirs.length === 0) {
      locks += 1;
      nextTokens.push({ ...token, row, col, path, locked: true, committedDir: null });
    } else if (forwardDirs.length === 1) {
      nextTokens.push({ ...token, row, col, path, committedDir: forwardDirs[0] });
    } else {
      splits += forwardDirs.length - 1;
      forwardDirs.forEach((d) => {
        nextTokens.push({ id: `${token.id}>${d}`, row, col, path, committedDir: d, locked: false });
      });
    }
  }

  return { tokens: nextTokens, newlyVisited, moved, splits, locks, winner };
}

// Weighted-score-into-letter-tier shape used elsewhere in the app (e.g. the Password Vault
// mission's Quantum Readiness Score), sized to what this mission actually asks the player to
// optimize: cover as much of the maze as possible in as few shared-control steps as possible.
export const SCORE_WEIGHTS = { coverage: 0.45, stepEfficiency: 0.45, timeRemaining: 0.1 };

export const GRADE_TIERS = [
  { min: 90, grade: 'S', label: 'Full Sweep', cls: 'text-emerald-300' },
  { min: 75, grade: 'A', label: 'Near-Complete Sweep', cls: 'text-cyan-300' },
  { min: 60, grade: 'B', label: 'Solid Coverage', cls: 'text-sky-300' },
  { min: 40, grade: 'C', label: 'Partial Coverage', cls: 'text-amber-300' },
  { min: 20, grade: 'D', label: 'Barely Mapped', cls: 'text-orange-300' },
  { min: 0, grade: 'F', label: 'Lost In The Maze', cls: 'text-red-300' },
];

export function computeWalkGrade(stepsTaken, parSteps, coverageRatio, timeRemainingRatio) {
  const stepEfficiency = Math.min(100, (parSteps / Math.max(stepsTaken, parSteps, 1)) * 100);
  const coverageScore = Math.min(100, coverageRatio * 100);
  const percentage = Math.round(
    coverageScore * SCORE_WEIGHTS.coverage +
      stepEfficiency * SCORE_WEIGHTS.stepEfficiency +
      timeRemainingRatio * 100 * SCORE_WEIGHTS.timeRemaining
  );
  const tier = GRADE_TIERS.find((t) => percentage >= t.min) ?? GRADE_TIERS[GRADE_TIERS.length - 1];
  return {
    percentage,
    stepEfficiency: Math.round(stepEfficiency),
    coverageScore: Math.round(coverageScore),
    ...tier,
  };
}
