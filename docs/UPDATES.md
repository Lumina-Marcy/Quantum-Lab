# Updates

## 2026-07-17 — Browser tab favicon

| Area                        | What changed                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `frontend/public/favicon.svg` | New favicon — a static rendition of the `QuantumCore` glowing-nucleus-with-orbital-rings symbol |
| `frontend/index.html`         | Added `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`                          |

Previously the browser tab showed the default document icon (no favicon was set). The new icon reuses
the same brand colors and gradient as [`QuantumCore.jsx`](../frontend/src/components/QuantumCore.jsx) —
blue (`#3b82f6`) and violet (`#a78bfa`) orbit rings around a white-to-purple radial nucleus gradient,
on the app's midnight-navy background — so the tab icon matches the app's "living symbol" used
throughout the site (homepage hero, login/register, sandbox, loading spinner).

## 2026-07-17 — Nav bar cleanup

| Area                             | What changed                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `frontend/src/components/Nav.jsx` | Removed the duplicate greyed-out "Resources" placeholder (the `SOON_LINKS` "coming soon" stub) |
| `frontend/src/components/Nav.jsx` | Renamed the working `/resources` nav link label from "Resources" to "Learn"   |

The nav previously showed two "Resources" entries — one working link and one disabled `SOON_LINKS`
placeholder left over from before the Resources page existed. The placeholder is now removed, and
the real link is relabeled "Learn".

## 2026-07-17 — Password Mission: selective port from `tylek-password`

| Area                                        | What changed                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `frontend/src/pages/PasswordMission.jsx`     | Replaced the breach → 3-card-defense → outcome flow with `tylek-password`'s breach → multi-account triage/vault/minigame → aftermath flow |
| `frontend/src/utils/triageData.js`           | New — account/defense data for the triage gameplay (added as-is from `tylek-password`) |
| `frontend/src/utils/passwordStrength.js`     | New — password entropy/strength scoring used by the breach narration (added as-is from `tylek-password`) |

`tylek-password` branched off an old point in history and diverged heavily from `main` (it's missing
entire features `main` has since added — Resources page, Sandbox, illustrations, docs, etc.), so a full
branch merge was not viable. Instead, only the Password Mission's post-"Start Mission" gameplay was
ported in: everything from the breach terminal through the new damage-control triage loop (defend
individual accounts, assemble a password-manager vault, survive 2FA/biometric minigames) to the
aftermath/readiness-score screen.

Main's mission-page chrome was kept — the persistent "Password Vault" `QuantumCore` header bar stays,
and the aftermath screen now ends with a "Learn Why →" button (styled to match main's existing purple
CTA) leading into main's existing classic-vs-quantum comparison page (`/mission/1/learn-why`,
`LearnWhy.jsx`) instead of `tylek-password`'s own ending. That comparison page itself was left
untouched — main's version is authoritative.

## 2026-07-21 — New interactive: Shor's Algorithm

| Area                                                        | What changed                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `frontend/src/components/interactives/ShorsAlgorithm.jsx`   | New — side-by-side multiplication-vs-factorization interactive             |
| `frontend/src/components/interactives/index.js`             | Registered it under the key `shors`                                       |

Side-by-side panels with editable numbers: the left (Multiplication) panel takes two factors and shows
their product as the one deterministic answer; the right (Factorization) panel takes that same product
and either "Search classically" (an animated trial-division search that reveals divisor pairs as it finds
them — showing there can be more than one valid factor pair, unlike multiplication's single answer) or
"Run Shor's Algorithm" (reveals the same answer instantly, regardless of number size). Closes with an
explanation of why Shor's algorithm — not just a speed boost like Grover's — threatens RSA encryption,
which relies on factoring being classically hard.

This is a lesson interactive (same mechanism as the existing `grovers` one) — lessons and their
`interactive` key live in the database, not in frontend code. Checked the `lessons` table directly:
the `shors-algorithm` row already had `interactive` set to `"shors"` (matching this key), so no DB
write was needed — see [`docs/METHODS.md`](METHODS.md) for the full status of that lesson and its
`Methods`-category siblings.

## 2026-07-21 — Mission Control: "coming soon" cards are now truly inert

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/components/MissionCard.jsx`   | "Coming soon" mission cards no longer navigate anywhere when clicked                   |
| `frontend/src/components/MissionCard.jsx`   | Their hover overlay now shows a plain "Coming Soon" notice instead of the flavor-text terminal readout |

Every mission card previously routed to `/mission/:id` regardless of status — a "coming soon" card
landed on `Mission.jsx`'s generic placeholder page with an inert `Start Mission` button, so clicking
did *something*, just nothing useful. Cards for missions still marked `'coming-soon'` in
`frontend/src/data/missions.js` now render as a plain, non-`Link` panel (click does nothing at all),
and hovering shows a lock icon with a "Coming Soon" message instead of the mission's terminal-line
flavor text. The Password Vault mission (`status: 'available'`) is unaffected — it still links to
`/mission/1` as before.

## 2026-07-21 — Quantum Gates interactive: single-qubit gate explanation + animation

| Area                                                              | What changed                                                        |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `frontend/src/components/interactives/QuantumGates.jsx`           | Added an explicit "what is a single-qubit gate" explanation           |
| `frontend/src/components/interactives/QuantumGates.jsx`           | The Bloch-sphere vector now animates (rotates) when a gate is applied instead of jumping instantly |
| `frontend/src/components/interactives/QuantumGates.jsx`           | Circuit diagram row now shows an output state chip (`\|ψ⟩ → … → \|ψ̄⟩`-style), matching the lesson video's notation |

Each gate (X, Y, Z, H, S) was already defined as a Bloch-sphere transformation, but as an instant
matrix apply — clicking a gate snapped the arrow straight to its new position. Rewrote each gate as
an explicit rotation axis + angle (verified by script to be exactly equivalent to the old matrix
functions across a range of test vectors) and drove the animation with Rodrigues' rotation formula,
so the in-between frames are real intermediate qubit states, not just a cosmetic tween. A generic
straight-line or spherical-interpolation tween would have broken on exactly the flips this lesson
demonstrates — X/Y/Z/H are all 180° rotations, and |0⟩→|1⟩ lands on the exact antipode, where a
two-point interpolation's rotation axis is undefined.

Added an intro paragraph explicitly defining a single-qubit gate ("acts on exactly one qubit... spins
that qubit's Bloch-sphere arrow to a new position") and contrasting it with multi-qubit gates (e.g.
CNOT), which can entangle qubits together in a way no single-qubit gate ever can alone.

## 2026-07-23 — New mission: Lost Medical Breakthrough ("Build the Molecule")

Mission 3 flipped from `'coming-soon'` to `'available'`, with a full new mission page at
`/mission/3/play` — see [`docs/MOLECULE_MISSION.md`](MOLECULE_MISSION.md) for the full writeup.

## 2026-07-23 — Fixed a broken Render deploy (merge artifact in `Mission.jsx`)

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/Mission.jsx`            | Fixed an unclosed `if` block in `handleStart` that broke the production build          |
| `frontend/src/pages/Mission.jsx`            | Mission 3 folded into `PLAYABLE_ROUTES` alongside Missions 1 and 2                     |
| `frontend/src/components/MissionPreviewCard.jsx` | Now reads `mission.estimatedTime` / `mission.difficulty` instead of hardcoded values |

Render's build was failing with `Mission.jsx:351: Unexpected "export"` — a merge artifact where a
new `playRoute`/`PLAYABLE_ROUTES` lookup (added alongside the new Maze Search mission) got merged in
without removing the old `isPasswordMission`/`isMoleculeMission` branching it replaced, leaving an
`if (playRoute) {` block that was never closed and swallowed the rest of the file. Removed the dead
duplicate branch and closed the block properly.

While fixing that, folded Mission 3 into `PLAYABLE_ROUTES` too, so all three playable missions (1, 2,
3) now share the same `MissionPreviewCard` instead of Mission 3 using its own bespoke inline card.
That surfaced a real bug the change would've otherwise exposed: `MissionPreviewCard` hardcoded
"5–7 minutes" / "🟢 Beginner Friendly" for every mission regardless of its actual data (harmless
coincidence for Mission 2, wrong for Mission 3) — fixed to read the mission's real `estimatedTime`
and `difficulty` fields, with a difficulty→emoji map (🟢 Beginner, 🟡 Intermediate, 🔴 Advanced).

## 2026-07-23 — Mission difficulty/time rebalance and reordering

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/data/missions.js`             | Password Vault difficulty: `Beginner` → `Intermediate`                                |
| `frontend/src/data/missions.js`             | Lost Medical Breakthrough: `Intermediate` → `Beginner`, `6 min` → `~1 min`             |
| `frontend/src/data/missions.js`             | Reordered `MISSIONS` — display order is now Medical Breakthrough, Maze Search, Password Vault, Supply Chain, Government Files |
| `frontend/src/pages/MissionHub.jsx`         | "New here?" recommendation banner now points at Lost Medical Breakthrough (`/mission/3`) instead of Password Vault |

Mission IDs and routes (`/mission/1`, `/mission/3`, etc.) are untouched — only array order and the
recommendation banner changed, since icons/routing/`PLAYABLE_ROUTES` all key off `id`, not position.

## 2026-07-23 — Scroll resets to top on every route change

| Area                | What changed                                                                          |
| -------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/App.jsx` | Added a `useEffect` keyed on the route's `pathname` that calls `window.scrollTo(0, 0)` |

React Router doesn't reset scroll position on navigation the way a full page load does — without
this, navigating away from partway down a long page (e.g. Resources) into a new route left the new
page scrolled to that same spot instead of starting at the top.

## 2026-07-23 — Fixed Lost Medical Breakthrough 404ing on Start

| Area                    | What changed                                                          |
| ------------------------ | ------------------------------------------------------------------------ |
| `frontend/src/App.jsx`  | Restored the missing `<Route path="/mission/3/play" element={<MoleculeMission />} />` |

Another casualty of the same Maze Search merge that broke `Mission.jsx`'s build: the `/mission/3/play`
route itself had been dropped from `App.jsx` entirely, even though `MoleculeMission` was still
imported. With no matching route, clicking "Start Mission" on Lost Medical Breakthrough fell through
to the `*` wildcard and landed on the 404 page. Re-added the route.

## 2026-07-28 — New mission: The Supply Chain Crisis ("Reroute the Network")

Mission 4 flipped from `'coming-soon'` to `'available'`, with a full new mission page at
`/mission/4/play` — see [`docs/SUPPLY_CHAIN_MISSION.md`](SUPPLY_CHAIN_MISSION.md) for the full
writeup. Directly reuses Lost Medical Breakthrough's (Mission 3) phase flow and mechanics (catch-and-
combine, deterministic scoring, Grover's-style reveal), reskinned as a logistics-routing puzzle
instead of a molecular-synthesis one. An earlier attempt at this mission (a drag-and-drop "Warehouse
Chaos" design with a manual-chaos timer) was abandoned and fully deleted after its timer-to-outcome
transition repeatedly failed in the browser; this version sidesteps that entire class of bug by
reusing Molecule Mission's proven single-`async`-effect pattern for its auto-playing phase instead
of an interval-plus-threshold timer.

## 2026-07-28 — Supply Chain Crisis: gameplay and outcome screens stripped to just navigation

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/SupplyChainMission.jsx` | `PlanningPhase` reduced to a single "Run the Quantum AI Optimizer" button              |
| `frontend/src/pages/SupplyChainMission.jsx` | `OutcomePhase` reduced to just the "Run It Back" / "Finish Mission" buttons            |
| `frontend/src/pages/SupplyChainMission.jsx` | Removed all now-dead code that only existed to support the removed content (floating nodes, manifest, guide bubble, verdict text, lesson panel) |

The interactive route-building mechanic, tutorial guide bubble, and lesson/reveal content are gone;
each phase is now just the button(s) needed to move to the next one. The Grover's-style amplitude
reveal between the two (`OptimizingPhase`) is untouched.

## 2026-07-28 — Supply Chain Crisis: rebuilt gameplay as "Warehouse Chaos"

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/SupplyChainMission.jsx` | Gameplay phase rebuilt into a 60-second drag-and-drop scheduling minigame (`ChaosPhase`) |
| `frontend/src/pages/SupplyChainMission.jsx` | New `UnlockPhase` notification screen between the chaos round and the Quantum Optimizer |
| `frontend/src/pages/SupplyChainMission.jsx` | `OutcomePhase` now shows a real before/after metrics table plus a learning paragraph, instead of bare buttons |

Full design writeup, including the specific fixes for every failure mode from the original (deleted)
Warehouse Chaos attempt, in [`docs/SUPPLY_CHAIN_MISSION.md`](SUPPLY_CHAIN_MISSION.md). The existing
Grover's-style amplitude reveal (`OptimizingPhase`'s candidates/amplitudes/oracle-diffusion effect)
was explicitly left unmodified — the chaos minigame only feeds it real "before" metrics and adds a
themed preroll in front of it, per instruction not to let the rebuild override that working logic.
Verified via `npx vite build` and a standalone Node simulation of the round's per-second reducer
across both an efficient-player and a does-nothing-player scenario; not verified in an actual browser
(no headless browser available in this sandbox).

## 2026-07-28 (later same day) — Supply Chain Crisis: cut leftover route-scoring algorithm, orders now cost workers

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/SupplyChainMission.jsx` | Removed the S/W/D/C route-scoring system (`OPTIMAL_ROUTE`, `scoreFor`, `buildCandidates`, etc.) — disconnected leftover flavor, not the algorithm the mission teaches |
| `frontend/src/pages/SupplyChainMission.jsx` | `workersRequired(qty)` — bigger orders now need up to 3 workers to assign, refunded correctly on completion/lateness/mismatch |
| `frontend/src/pages/SupplyChainMission.jsx` | Board scaled up: `DOCK_COUNT` 4→6, `WORKER_POOL` 6→10, `ROBOT_POOL` 3→4, 3-column dock grid |

The Grover's-style amplitude reveal itself (oracle/diffusion math) was kept — it's the actual
algorithm the mission demonstrates — just simplified to amplify toward a randomly chosen generic
"Plan" label instead of a scored route code that never corresponded to anything in the warehouse
simulation. See [`docs/SUPPLY_CHAIN_MISSION.md`](SUPPLY_CHAIN_MISSION.md) for the full writeup,
including the worker-accounting invariant verified via Node simulation across 30 runs.

## 2026-07-28 (fourth same-day pass) — cut the amplitude-bars reveal, straight to outcome

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/SupplyChainMission.jsx` | Removed `OptimizingPhase` (the amplitude-bars step) and its dead supporting code (Grover helpers, `buildScheduleLabels`, `CANDIDATE_SLOTS`, `sleep`, `TRUCK_POOL`) |
| `frontend/src/pages/SupplyChainMission.jsx` | `UnlockPhase`'s button now advances directly from `'unlocked'` to `'outcome'`         |

The mission now goes intro → 60s Warehouse Chaos → "Quantum Optimizer Available" notification →
"Optimized Schedule Deployed" outcome, with no intervening visualization step.

## 2026-07-28 (fifth same-day pass) — conveyor jam pulls a worker, faster orders, pre-round tutorial

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/SupplyChainMission.jsx` | The `jam` event now also pulls one worker off the floor for `JAM_REPAIR_S` (6s), on top of its existing dock-delay effect |
| `frontend/src/pages/SupplyChainMission.jsx` | Order spawn cadence tightened from every 3–6s to every 2–4s                            |
| `frontend/src/pages/SupplyChainMission.jsx` | New `TutorialPhase` — a 5-step walkthrough between the intro and the chaos round; the 60s timer only starts once the player clicks through it and hits "Start Warehouse Shift" |

The tutorial is a plain step-through screen, not an overlay inside the chaos round itself — `ChaosPhase`
(and its round-ending timer) only mounts once the tutorial hands off, so there was no need to gate or
delay anything inside the timer logic itself. Replaying via "Run It Back" skips both the intro and the
tutorial and goes straight back into a fresh chaos round, so the walkthrough is only ever shown once
per visit to the mission. See [`docs/SUPPLY_CHAIN_MISSION.md`](SUPPLY_CHAIN_MISSION.md) for the full
writeup, including the updated worker-accounting invariant (now `used + free + repairing === pool`)
verified via Node simulation.

## 2026-07-28 (sixth same-day pass) — traffic delay now freezes all dock progress

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/SupplyChainMission.jsx` | `traffic` event no longer just adds `+3s` to active docks — it stalls *all* dock progress for `TRAFFIC_FREEZE_S` (4s) via a global `freezeUntil` timestamp |

Order deadlines keep ticking down the whole time it's frozen, so this is a real setback rather than
a pause — trucks are stuck, but customers still expect their delivery on time. A `🚦 All docks
stalled Xs` indicator shows in the status bar for the duration. Verified with an isolated Node
simulation of the freeze window: dock progress never advances during the freeze, deadlines tick down
every single second regardless, and progress resumes correctly the instant the freeze expires.

## 2026-07-28 (seventh same-day pass) — re-added a quantum simulation step before the outcome

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/SupplyChainMission.jsx` | New `SimulationPhase` — sits between `'unlocked'` and `'outcome'`, showing a live "schedules evaluated" counter and "best satisfaction" readout converging over ~3.8s |

Earlier the same day, the amplitude-bars reveal (`OptimizingPhase`) was cut entirely so `'unlocked'`
went straight to `'outcome'` — that turned out to remove more than intended. `SimulationPhase` puts a
visualization back in that spot: a scripted, eased progression from 0 to `POSSIBLE_SCHEDULES`
evaluated and from 4% to 97% satisfaction, driven by the same single-`async`-effect-with-`sleep()`
pattern used elsewhere in this mission and in Molecule Mission's `SearchingPhase` — it calls
`onComplete()` directly at the end of that effect, never from inside a `setState` updater. Verified
the eased math lands exactly on `POSSIBLE_SCHEDULES` / 97% at the final step via a standalone Node
check, and confirmed the full build is clean.

## 2026-07-28 (eighth same-day pass) — simulation now grounded in the comparison sheet's real numbers

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/SupplyChainMission.jsx` | `SimulationPhase` now animates a real `optimalIterations(POSSIBLE_SCHEDULES)` round count (1,963) instead of a decorative "schedules evaluated" number, and states the real classical-vs-quantum duration comparison |

The round counter, `QUANTUM_ROUNDS` (1,963) and `CLASSICAL_CHECKS` (3,125,000), and the duration
labels (`72.3 days` classical, `1.1 hrs` quantum) are computed with the exact same formula and rate
assumption (2 sec/operation) as the "Supply Chain Crisis — Quantum vs Classical Scheduling Search"
Google Sheet created earlier the same day — verified by a standalone Node check that all four figures
match the sheet exactly. The on-screen animation still compresses this into ~3.8 seconds for
gameplay pacing, but the duration text underneath states the real, uncompressed comparison so the
compression itself is never presented as literal.

## 2026-07-28 (ninth same-day pass) — Quantum AI Optimizer now shows a run-through and scaling table

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/SupplyChainMission.jsx` | Once the live round animation finishes, `SimulationPhase` now shows a 5-step "How the optimizer got there" run-through (superposition → oracle → diffusion → repeat → measure) and a 4-row scaling comparison table (100 / 10,000 / 1,000,000 / 6,250,000 schedules) |
| `frontend/src/pages/SupplyChainMission.jsx` | The phase no longer auto-advances after a fixed delay — it now waits for a "Continue to Results →" button click, so there's no rush to read the new content |

The scaling table's numbers are computed in-app with the exact same `optimalIterations` formula and
2-sec/operation rate assumption as both the standalone comparison sheet and the earlier duration
labels — verified all four rows match the sheet exactly (7.1x / 64.1x / 636.9x / 1,592.0x speedup).
The comparison data is rendered directly in the app rather than linking out to the personal Google
Sheet, since that file lives in one user's Drive and isn't something a deployed build's other
visitors could open.

## 2026-07-28 (tenth same-day pass) — shorter order deadlines

| Priority  | Deadline before | Deadline after |
| --------- | ---------------- | --------------- |
| Express   | 22s              | 15s             |
| High      | 32s              | 22s             |
| Standard  | 48s              | 30s             |

`PRIORITY_META.deadlineS` cut across the board (`frontend/src/pages/SupplyChainMission.jsx`), keeping
each tier's deadline-to-handling-time ratio close to ~3x so orders stay winnable but with noticeably
less slack before they go late.

## 2026-07-28 (eleventh same-day pass) — blank phase-flow scaffold for Government Files (Mission 5)

| Area                                             | What changed                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | New — a blank scaffold copying the intro → gameplay → consequence → outcome phase-flow shape used by every other mission, with only placeholder text and the buttons that advance between phases |
| `frontend/src/App.jsx`                           | Registered `/mission/5/play` so the scaffold is directly reachable for development |

Deliberately not wired into `Mission.jsx`'s `PLAYABLE_ROUTES` or flipped to `'available'` in
`missions.js` yet — Mission 5's card on the Mission Hub stays inert ("Coming Soon") so this
placeholder isn't exposed to real visitors while its content is still blank. Fill in each phase
component's placeholder paragraph in place; the state machine (`useState('intro')`, the
`AnimatePresence mode="wait"` switch, one `onNext`/`onReplay` callback per phase) doesn't need to
change shape as content gets added, matching how every other mission in this app is structured.

**Same day, hooked up:** since nothing is deployed yet, flipped Mission 5's `status` to `'available'`
in `missions.js` and added `5: '/mission/5/play'` to `Mission.jsx`'s `PLAYABLE_ROUTES`. The Mission
Hub card is now live and clickable like every other mission, still showing the blank placeholder
scaffold until its phases get real content.

## 2026-07-28 (twelfth same-day pass) — Government Files: filled in with a Quantum Key Distribution mission

The blank scaffold now has real content across all 6 phases — intro, a clean-transmission tutorial,
an interception round with a three-choice decision (only "Discard Key" is correct), a harder round
requiring the player to scan and click the tampered photon, a 100-photon final round, and an outcome
comparing classical vs. quantum interception. See
[`docs/GOVERNMENT_FILES_MISSION.md`](GOVERNMENT_FILES_MISSION.md) for the full writeup. Every
animated sequence is triggered by a button click rather than a mount effect, guarded by a
`useMountedRef()` check after each `await` — deliberately avoiding the auto-timer architecture that
caused the Warehouse Chaos mission's original bugs, since nothing here needs to run without a player
action starting it first.

## 2026-07-28 (thirteenth same-day pass) — fixed Government Files getting stuck at "Transmitting…"

| Area                                            | What changed                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | `useMountedRef()` now resets `ref.current = true` inside the effect body, not just via the initial `useRef(true)` |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | `PhotonRow` now spreads photons across distinct vertical lanes instead of one shared horizontal track |

Every animated phase (`TutorialPhase`, `SpyPhase`, `Round3Phase`) got permanently stuck at
"Transmitting…" in dev mode after clicking Start. Root cause: React 18 StrictMode's dev-only
mount → cleanup → remount simulation ran `useMountedRef`'s cleanup (setting `ref.current = false`)
without anything ever setting it back to `true`, so every later `if (!mountedRef.current) return`
check silently bailed out for the rest of the component's real lifetime — `setArrived(true)` never
ran. This is a dev-only StrictMode effect — production builds don't double-invoke effects — so
`npx vite build` had no way to catch it; it only surfaced once the app was actually run in a browser
(confirmed by a user screenshot showing the stuck "Transmitting…" state). Fixed by setting
`ref.current = true` at the top of the effect body itself, so the simulated cleanup-then-rerun cycle
leaves it in the correct (mounted) state instead of permanently flipped false.

Separately (not the cause of the stuck state, but a real cosmetic bug on the same screen): all
photons in a `PhotonRow` shared the identical start and end position, so they'd converge onto the
exact same point and visually collapse into a single dot once arrived, hiding all but the
last-rendered one. Fixed by spreading photons across distinct vertical lanes within the row.

## 2026-07-28 (fourteenth same-day pass) — Rounds 2 and 3 become a "track the moving photon" game

| Area                                            | What changed                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | New `driftWaypoints`/`DriftingPhoton`/`PhotonField` — photons now drift continuously in a bounded field instead of traveling once in a straight line |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | `SpyPhase` (Round 2): the tampered photon changes color while still drifting, and the player can act at any time — no more fixed "wait for it to arrive" gate |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | `Round3Phase`: after scanning, the player clicks directly on the tampered photon *while it's still moving*, rather than picking from a static row of buttons |

Reuses the same jitter-seeded looping drift idiom as Molecule Mission's `FloatingAtom` (proven,
already working elsewhere in this app) rather than inventing new animation machinery. `PhotonRow`
(the straight-line traversal) is kept for `TutorialPhase` only, where the point is a calm baseline
"here's what clean looks like," not a tracking challenge.

## 2026-07-28 (fifteenth same-day pass) — new Round 4: triage multiple messages at once

| Area                                            | What changed                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | New `TriagePhase` — five named messages arrive together, each independently marked "Send" or "Discard" |

Sits between Round 3 and the Final Round (`phase: 'triage'`). Where Rounds 2–3 are about tracking one
moving target, this round is about applying the same rule (discard if touched) consistently across
several independent messages presented at once — each shows a row of integrity dots (all green if
clean, one red if compromised via `messageDotPattern`), and a wrong Send/Discard call just gives
inline feedback with no penalty, so there's no dead end.

## 2026-07-28 (sixteenth same-day pass) — Round 4 reworked into a memorize-then-verify game

The card-based "Sort the Traffic" design (previous entry) didn't match what was actually wanted — a
screenshot of it prompted a full rework into a proper memory game (`phase: 'memory'`, `MemoryPhase`,
replacing `TriagePhase`):

1. **Preview** — six photons sit in fixed lanes at Agency A for 4 seconds; the player has to
   memorize which color is in which lane before anything moves.
2. **Traveling** — all six drift toward Agency B over a few seconds (each lane's duration/wobble
   randomized independently via `Math.random()`, not a shared jitter seed, since this is genuine
   per-playthrough replay variance rather than a "looks random, stays reproducible" layout); two
   random lanes swap to a different color from the same six-color set partway through transit.
3. **Deciding** — each of the six arrived photons gets an independent Keep/Discard button; the
   player has to recall the original layout and act on whichever lanes don't match anymore.

Ends with a score out of 6, shown either way (this round doesn't gate on a correct outcome the way
every other round in the mission does — it's explicitly a skill/memory check with a visible result,
not a pass/fail gate). `pickSwappedColor` always swaps to one of the *other* original colors, never
an outside color, so the final six photons look completely ordinary and only actual memory of the
preview phase reveals which lanes moved.

## 2026-07-28 (seventeenth same-day pass) — fixed lane misalignment, added bouncing + faster travel

| Area                                            | What changed                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | Round 4's decision UI switched from a 3-column grid to a single-column list, preserving lane order top-to-bottom |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | New `bouncePath()` — photons now ricochet between the top and bottom of the field while traveling, instead of a single gentle wobble |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | Travel is faster: per-lane duration cut from 2.4–3.6s to 1.3–2.0s, overall stage window cut from 3000ms to 2200ms |

The 3-column grid reshuffled lane order (e.g. lane 4 landed next to lane 1 instead of below it),
breaking the spatial memory the player just built watching the photons travel in fixed vertical
lanes — that reshuffle was the reported misalignment. Fixed by keeping the decision list in the same
top-to-bottom order as the travel lanes. Separately, `bouncePath()` replaces the old single-wobble
`top` keyframe with a 5–7 point ricochet path per lane (still starting/ending at the same left
positions), and every lane's own animated duration was kept strictly under the stage's overall
`MEMORY_TRAVEL_MS` window (verified via a standalone check that every generated path still starts at
4% and ends at 92%), so lanes reliably finish their motion before the stage cuts over to deciding
rather than jumping mid-flight.

## 2026-07-28 (eighteenth same-day pass) — Round 4 split into two independently-scored messages

| Area                                            | What changed                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | New `MEMORY_MESSAGES` — the six photons are now two 3-photon message clusters, each positioned in its own visual band (`memoryLaneTop`) |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | Scoring changed from "N of 6 photons right" to "N of 2 messages secured" — a message only counts if *every* photon in its cluster is called correctly |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | Decision screen now groups photons under their message, with a per-message ✓ Secured / ✗ Compromised badge |

One missed swap anywhere in a message's 3-photon cluster now compromises that whole message, not
just the one bit — matching how a real shared key works (a single tampered bit ruins the entire
key, not just its own share). The mission still doesn't hard-gate on this round's result; the
per-message breakdown and the "N of 2 messages secured" line are shown either way before Continue.

## 2026-07-28 (nineteenth same-day pass) — scaled to 5 messages, varied movement per photon

| Area                                            | What changed                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | `MEMORY_MESSAGES` expanded from 2 to 5 messages (15 photons total, deliberately overwhelming) |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | New `wavePath()` alongside `bouncePath()` — each photon randomly gets one style or the other, so a cluster's photons don't all move alike |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | Per-photon duration widened from 1.3–2.0s to 1.0–2.4s — genuinely different speeds, not just different bounce heights |
| `frontend/src/pages/GovernmentFilesMission.jsx`  | `MEMORY_CHANGE_COUNT` scaled 2→5 (preserving the ~1-in-3 ratio) and the 6-entry hardcoded color list replaced with a 9-color palette assigned cyclically across 15 photons |

`messageBand()`/`memoryLaneTop()` generalized to divide the field into `MEMORY_MESSAGES.length` even
bands instead of two hardcoded ones, so the layout scales automatically if the message count changes
again. Verified via a standalone check that all 15 photons land in non-overlapping bands and that the
new max per-photon duration (2.4s) still stays under the stage's travel window (2.7s, bumped from
2.2s) — otherwise a slow photon could still be mid-bounce when the stage cut to deciding.
