# Mission 4 — The Supply Chain Crisis ("Reroute the Network")

## Summary of Changes

| Area                                          | What changed                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/data/missions.js`               | Mission 4 status flipped from `'coming-soon'` to `'available'`, time updated to `~2 min` |
| `frontend/src/pages/SupplyChainMission.jsx`   | New — the full mission, at route `/mission/4/play`                                    |
| `frontend/src/pages/Mission.jsx`              | Mission 4 folded into `PLAYABLE_ROUTES`, so it shares the shared `MissionPreviewCard`/`Start Mission` flow |
| `frontend/src/App.jsx`                        | Registered the `/mission/4/play` route                                                |
| `frontend/src/components/MissionCard.jsx`     | Mission 4's icon switched from `Database` to `Truck` (lucide-react)                    |

## How it works

The mission went through three iterations. It originally reused Lost Medical Breakthrough's
architecture directly (catch-and-combine mechanic, manifest panel, guide bubble). That content was
then stripped to bare navigation buttons. As of 2026-07-28 the gameplay phase was rebuilt a third
time as **Warehouse Chaos**: a 60-second manual scheduling minigame (drag orders onto loading docks,
race their deadlines, ride out random disruptions) that feeds directly into the *existing* Grover's-
style amplitude reveal — that reveal's math and animation (`buildCandidates`, `scoreFor`, the
oracle/diffusion loop) were **not modified**, only fed real "before" numbers from the chaos phase and
given a themed "Analyzing..." preroll in front of it.

An earlier attempt at this exact Warehouse Chaos concept (before Supply Chain Crisis existed as a
mission) was abandoned and fully deleted after its manual-chaos-timer-to-outcome transition
repeatedly failed in the browser. This rebuild deliberately avoids every failure mode identified in
that attempt:

- **No callback-from-updater.** The chaos round's ending is decided by exactly one `setTimeout`,
  set up once on mount, that reads the latest simulation state via a ref and calls `onFinish`
  directly from its own callback — never from inside a `setGame` updater. This was the root cause of
  the original "Cannot update a component while rendering a different component" bug.
  [[`ChaosPhase`]]
- **No manual/auto-transition race.** There is no "skip ahead" button competing with the timer —
  per the design brief, the Quantum Optimizer stays locked until the full 60 seconds elapse, so
  there's only ever one path to the next phase.
  [[`UnlockPhase`]]
- **Native HTML5 drag-and-drop, not framer-motion drag.** Order cards use plain `draggable`/
  `onDragStart`/`onDrop`, not `motion.div`'s `drag` prop — sidesteps framer-motion's own
  "disable text selection during drag, restore after" behavior entirely, which was the cause of a
  stuck-selection bug in the original attempt.
- **No `overflow-x-auto` container around anything draggable.** The pending-orders queue uses
  `overflow-y-auto` (its only intentionally-scrollable axis) with `flex`/block-width cards, not the
  `overflow-x-auto` + drag combination that silently clipped both axes before. Native drag images
  also aren't subject to ancestor CSS clipping the way the framer-motion-rendered dragged element
  was.
- **The existing reveal logic is provably untouched.** `OptimizingPhase`'s internals (candidates,
  amplitudes, the oracle/diffusion `run()` effect) are byte-for-byte the same code that was already
  working; the only change is a `showPreroll` gate added *around* — not inside — that effect, delaying
  when it starts without altering what it does.

This was verified with `npx vite build` (clean) and a standalone Node.js simulation of the `tick()`
reducer across both an "efficient player" and a "does-nothing" player, confirming the round always
reaches exactly 60 elapsed ticks and produces bounded, sane before/after metrics in both extremes.
**Not verified in an actual browser** — this sandbox still has no working headless browser (missing
system libraries for Chromium/Playwright, no passwordless `sudo` to install them) — so the drag-and-
drop interaction itself, the visual layout, and the final on-screen transition have not been manually
confirmed to work end-to-end the way the deleted attempt's logic once was but still didn't hold up.

## 2026-07-28 (third same-day pass) — cut the amplitude-bars reveal entirely

The `OptimizingPhase` amplitude-bars step (and everything that only existed to feed it — the Grover
helper functions, `buildScheduleLabels`, `CANDIDATE_SLOTS`, `sleep`, and the "Analyzing..." preroll)
was removed outright. `UnlockPhase`'s "⚛ Run the Quantum Optimizer" button now transitions straight
to `OutcomePhase`. `TRUCK_POOL` was also dropped since its only use was display text in the now-gone
preroll.

## 2026-07-28 (seventh same-day pass) — a visualization step returns as `SimulationPhase`

Cutting the visualization step entirely (previous entry) turned out to remove more than intended —
`SimulationPhase` puts one back between `'unlocked'` and `'outcome'`, but as a distinct, simpler
mechanic from the old amplitude bars: a live counter (`round`) climbing from 0 to `QUANTUM_ROUNDS`
and a "best satisfaction" readout (`satisfaction`) climbing from 4% to 97%, both driven by the same
eased-progression math (`1 - (1 - t) ** 2`, fast at first and settling near the end) over `SIM_STEPS`
(24) steps of `SIM_STEP_MS` (120ms) each — roughly 3.8s total, including a 900ms hold at the final
value before handing off. `sleep()` was re-added (it had been removed along with the old reveal)
since this phase needs the same single-`async`-effect-with-awaited-`sleep()` pattern used throughout
this mission's scripted sequences.

**Later the same day**, the counter was changed to climb toward the real `optimalIterations(
POSSIBLE_SCHEDULES)` round count (`QUANTUM_ROUNDS`, 1,963) instead of a decorative number, and
duration text was added underneath (`CLASSICAL_TIME_LABEL` / `QUANTUM_TIME_LABEL`) stating the real,
uncompressed classical-vs-quantum comparison — grounded in the exact same formula and 2-sec/operation
rate assumption as the "Supply Chain Crisis — Quantum vs Classical Scheduling Search" Google Sheet
created earlier in the session, so the two are numerically consistent with each other rather than
independently invented.

**Later still**, once the live round animation finishes, the phase now shows two more things instead
of auto-advancing: a `RUN_THROUGH_STEPS` list (superposition → oracle → diffusion → repeat → measure)
explaining conceptually what the amplification loop was actually doing, and a `SCALING_ROWS` table (4
sample points: 100 / 10,000 / 1,000,000 / 6,250,000 possible schedules) showing the same
classical-vs-quantum comparison at different scales — computed with the identical formula as the
external comparison sheet rather than linked to it, since that sheet lives in one user's personal
Drive and wouldn't be reachable by anyone else who opens a deployed build. `onComplete()` is now only
called from a "Continue to Results →" button click, not automatically after a delay, so there's no
time pressure to read either addition.

## 2026-07-28 (fifth same-day pass) — jam pulls a worker, faster orders, pre-round tutorial

- **Conveyor jams now cost a worker, not just dock time.** On top of adding `+5s` to a random active
  dock, the `jam` event pulls one worker off `workersFree` (if any are free) for `JAM_REPAIR_S` (6s),
  tracked in a `workerRepairAt` list exactly like `robotRechargeAt` recharges robots. The status bar
  shows a `🔧 Repairing N` indicator whenever workers are off fixing a jam, so the drop in available
  workers isn't silently unexplained.
- **Orders spawn faster.** Cadence tightened from every 3–6s to every 2–4s (`nextSpawnAt`), for more
  sustained pressure across the 60-second round.
- **A one-time tutorial gates the timer.** New `TutorialPhase` — a 5-step, "Next"-through walkthrough
  covering dragging orders onto docks, the worker-cost-scales-with-quantity mechanic, robots/Rush,
  the six dynamic events (calling out the jam's new worker-pull explicitly), and the 60-second limit.
  It sits as its own phase (`'tutorial'`) between `'intro'` and `'chaos'` — `ChaosPhase` (and its
  round-ending timer) only mounts once the player clicks "Start Warehouse Shift," so the timer
  genuinely doesn't start until every mechanic has been explained. No changes were needed inside
  `ChaosPhase` itself to make this true. "Run It Back" skips straight back to `'chaos'` (same as
  before), so the tutorial is only ever shown once per visit to the mission.

## Mission flow

1. **Crisis intro** (`phase: 'intro'`) — terminal-style narration establishing the stakes. Ends with
   a "Begin Rerouting" button.
2. **Tutorial** (`phase: 'tutorial'`, `TutorialPhase`) — a 5-step walkthrough of every mechanic.
   Ends with "Start Warehouse Shift," which is the only thing that transitions to `'chaos'`.
3. **Warehouse Chaos** (`phase: 'chaos'`, `ChaosPhase`) — a 60-second real-time minigame. Orders
   spawn on a random 2–4s cadence (`randomOrder`), each with a priority (Express/High/Standard)
   controlling its handling time and deadline. The player drags a pending order onto one of
   `DOCK_COUNT` loading docks (consumes `workersRequired(qty)` workers from `WORKER_POOL`); the dock
   counts down `remainingS`, and finishing frees those workers and increments `delivered`. Missing a
   deadline (pending or still docked) increments `late` instead and frees any dock/workers holding
   it. A `🤖 Rush` button on active docks consumes one of `ROBOT_POOL` robots to halve the dock's
   remaining time, recharging after `ROBOT_RECHARGE_S`. Every 10–16s a random event from
   `EVENT_TYPES` fires — shown as a 3-second banner; the `jam` event additionally pulls a worker off
   the floor for `JAM_REPAIR_S`. A single `setInterval` drives this per-second `tick()` (pure,
   side-effect-free besides `setGame`); a completely separate `setTimeout` is the sole authority on
   ending the round (see above).
4. **Notification** (`phase: 'unlocked'`, `UnlockPhase`) — "Quantum Optimizer Available," with the
   one button that advances to the simulation.
5. **Simulation** (`phase: 'simulating'`, `SimulationPhase`) — a scripted, ~3.8s visualization: a
   live "amplification round" counter climbing to `QUANTUM_ROUNDS` (the real
   `optimalIterations(POSSIBLE_SCHEDULES)` value, 1,963) and a "best satisfaction" readout climbing
   to 97%, both eased to move fast at first and settle near the end. States the real (uncompressed)
   time comparison underneath — `QUANTUM_TIME_LABEL` (1.1 hrs) vs `CLASSICAL_TIME_LABEL` (72.3 days)
   — so the animation's ~3.8s of screen time is never presented as the literal duration. Advances to
   the outcome automatically when it finishes.
6. **Outcome** (`phase: 'outcome'`, `OutcomePhase`) — a before/after metrics table (Late Orders,
   Truck Idle Time, Orders Delivered, Customer Satisfaction) comparing the chaos phase's actual
   results (`summarizeChaos`) against a deterministic optimized projection
   (`computeOptimizedMetrics`), a learning paragraph on combinatorial scheduling explosion, and "Run
   It Back" / "Finish Mission".

## 2026-07-28 (later same day) — dropped the leftover route-scoring algorithm, added worker cost

Two follow-up changes, both scoped to the gameplay phase:

1. **Removed the S/W/D/C route-scoring system.** `OPTIMAL_ROUTE`, `OPTIMAL_SCORE`, `isOptimal`,
   `scoreFor`, `formatFormula`, `formulaKey`, `buildCandidates`, and the `jitter` import are gone.
   That system was a holdover from Molecule Mission's cure-formula scoring, generating fake "route
   code" strings (`S23W14D6C9`) that never corresponded to anything in the actual warehouse
   simulation — pure disconnected flavor, not the algorithm the mission is actually teaching. The
   Grover's-style amplitude amplification itself (`uniformAmplitudes`, `applyOracle`,
   `applyDiffusion`, `optimalIterations`) is exactly what the mission needs to keep, so it stayed:
   `OptimizingPhase` now amplifies toward one randomly chosen label out of `CANDIDATE_SLOTS` generic
   "Plan A".."Plan J" schedules (`buildScheduleLabels`) instead of a scored route. `POSSIBLE_SCHEDULES`
   replaces the old derived `TOTAL_COMBINATIONS` as a standalone flavor constant for the intro
   narration, decoupled from any real combinatorial system.
2. **Order quantity now costs workers.** `workersRequired(qty)` — 1 worker for qty ≤ 15, 2 for
   16–35, 3 for 36+ (the app's max) — is checked in `handleDropOnDock` (`prev.workersFree < needed`
   blocks the assignment) and the consumed count is stored on the dock (`workersUsed`) so it can be
   refunded correctly wherever a dock frees up: normal completion, a deadline lapsing while active,
   and the `mismatch` event bouncing an order back to pending all now refund `dock.workersUsed`
   rather than a flat 1. This means a couple of large orders can tie up most of the worker pool at
   once, compounding the deadline pressure. The pending-order card and the active-dock card both
   display the worker cost/usage so the player can plan around it.

Also scaled the board up for a bigger, busier feel: `DOCK_COUNT` 4 → 6, `WORKER_POOL` 6 → 10,
`ROBOT_POOL` 3 → 4, and the dock grid moved from a 2-column to a 3-column layout inside a wider
(`max-w-5xl`) container.

Verified via `npx vite build` and an updated Node simulation that greedily fills every empty dock
each tick and checks a worker-accounting invariant (workers used across active docks + workers free
always equals `WORKER_POOL`, every active dock's `workersUsed` stays within `[1, 3]`) on every single
tick across 30 independent 60-second runs — held in all of them, with the round always terminating at
exactly 60 elapsed ticks.

## Key constants (`frontend/src/pages/SupplyChainMission.jsx`)

- `POSSIBLE_SCHEDULES` — a flavor-only figure for the intro/outcome narration, not derived from any
  real combinatorial system.
- `CHAOS_DURATION_S` — length of the manual chaos round (60s); the Quantum Optimizer stays locked
  until this elapses.
- `DOCK_COUNT` / `WORKER_POOL` / `ROBOT_POOL` — the resource pools the player manages.
- `workersRequired(qty)` — how many of `WORKER_POOL`'s workers an order's quantity demands (1–3).
- `JAM_REPAIR_S` — how long a worker is pulled off the floor when a conveyor jam fires (6s).
- `TRAFFIC_FREEZE_S` — how long *all* active docks stall (no progress, but deadlines still tick) when
  the `traffic` event fires (4s), tracked via the global `freezeUntil` elapsed-tick timestamp.
- `TUTORIAL_STEPS` — the 5-step walkthrough content shown by `TutorialPhase` before the round starts.
- `QUANTUM_ROUNDS` / `CLASSICAL_CHECKS` — `optimalIterations(POSSIBLE_SCHEDULES)` (1,963) and
  `POSSIBLE_SCHEDULES / 2` (3,125,000), the real round/check counts `SimulationPhase` animates toward
  and states in its comparison text.
- `SIM_RATE_SEC` / `CLASSICAL_TIME_LABEL` / `QUANTUM_TIME_LABEL` — the shared 2-sec/operation rate
  assumption and the resulting formatted durations (72.3 days / 1.1 hrs), computed with the same
  formula as the external comparison spreadsheet so the two never drift out of sync.
- `RUN_THROUGH_STEPS` — the 5-step conceptual explanation (superposition/oracle/diffusion/repeat/
  measure) shown once the simulation animation finishes.
- `SCALING_SAMPLE_NS` / `SCALING_ROWS` — 4 sample schedule-counts and their computed classical/quantum
  times and speedup, rendered as an in-app table on the same finished-simulation screen.
- `PRIORITY_META` — per-priority handling time and deadline (Express fastest/shortest fuse, Standard
  slowest/longest).
- `EVENT_TYPES` — the six dynamic disruption events, each applying a distinct effect inside `tick()`.
- `summarizeChaos(game)` / `computeOptimizedMetrics(before)` — pure functions turning the chaos
  round's raw counters into the before/after table shown in `OutcomePhase`.
