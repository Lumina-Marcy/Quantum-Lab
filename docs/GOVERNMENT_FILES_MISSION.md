# Mission 5 — Government Files ("Quantum Key Distribution")

## Summary of Changes

| Area                                                | What changed                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/pages/GovernmentFilesMission.jsx`     | Filled in the blank phase-flow scaffold with the full Quantum Key Distribution mission |

## How it works

Teaches quantum key distribution's core guarantee — measuring a quantum bit disturbs it, so an
eavesdropper can never read a key in transit without leaving evidence — by having the player
experience that disturbance directly across an escalating series of transmission rounds, rather than
reading about it. No round auto-advances on a timer; every transition is a manual button click, so
there's no rush and no risk of the timer-vs-manual-action races that caused real problems in an
earlier mission this project (Warehouse Chaos).

Each animated phase (photon streams, the final integrity grid) is driven by a plain `async` function
called from a button's `onClick` — not a mount effect and not a `setState` updater — guarded by a
`useMountedRef()` ref checked after every `await`, so nothing touches state after the phase unmounts.
This sidesteps the entire "callback fired from inside a setState updater" bug class documented
elsewhere in this repo's mission history without needing the effect-gating patterns those missions
use for auto-playing sequences, since here every sequence starts from a deliberate click, not a mount.

## Mission flow

1. **Intro** (`phase: 'intro'`) — terminal-style narration (reusing the same sequential-reveal
   pattern as Molecule Mission/Supply Chain Crisis) establishing the stakes: a classified report
   needs a shared key before it can be encrypted, and classical keys can be copied without detection.
   Ends with "Begin Transmission".
2. **Phase 1 — Key Generation** (`phase: 'tutorial'`, `TutorialPhase`) — five colored photons
   (`TUTORIAL_PHOTONS`) travel cleanly from Agency A to Agency B. No interception yet — this is the
   baseline "here's what a clean transmission looks like" tutorial. Ends in "✓ Key Established".
3. **Round 2 — Interception** (`phase: 'spy'`, `SpyPhase`) — five photons drift continuously around
   a bounded `PhotonField` (never pausing — tracking one is closer to a shell game than a static
   before/after comparison) while a spy icon looms over the channel (`AgencyBar showSpy`). Partway
   through (`SPY_TAMPER_MS`), one photon (`SPY_TARGET`) quietly changes color to a shade already
   used elsewhere in the field, so actually noticing it takes attention, not just spotting an odd
   color out. The player can act at any time via three choices — Continue, Generate New Key, Discard
   Key — only one of which (Discard Key) is correct; the other two show specific feedback and let
   the player try again with no penalty.
4. **Round 3 — Find the Interception** (`phase: 'round3'`, `Round3Phase`) — seven photons drift in
   the same continuously-moving field, but nothing visibly changes color this round. The player must
   click "🔍 Scan Transmission" to reveal a per-photon integrity dot (green/red) that travels along
   with each moving photon, then click directly on the one flagged red (`ROUND3_TARGET`) *while it's
   still drifting* to isolate it. A wrong click just nudges "look again"; once correct, either
   "Discard Key" or "Generate New One" succeeds (this round's lesson is *noticing and tracking*, not
   picking the one correct action out of a trick set the way Round 2 was).
5. **Round 4 — Memory Check** (`phase: 'memory'`, `MemoryPhase`) — a three-stage memory game over
   five independent 3-photon messages (`MEMORY_MESSAGES`, 15 photons total — deliberately
   overwhelming, gesturing at the fact a real agency triages thousands of keys, not one or two): (a)
   **preview**, all 15 sit queued at Agency A in five visually separated clusters for
   `MEMORY_PREVIEW_S` (4s) — memorize which color is in which position, in which message; (b)
   **traveling**, every photon moves toward Agency B on its own randomly-assigned path style
   (`bouncePath` or `wavePath`, chosen per photon, not per message) and its own randomized duration
   (1.0–2.4s), so no two photons necessarily look alike or move at the same speed even within one
   cluster; `MEMORY_CHANGE_COUNT` (5 of 15) swap to a different color from the palette partway
   through transit; (c) **deciding**, grouped by message, each arrived photon gets an independent
   Keep/Discard button. A message only counts as **secured** if *every* photon in its cluster gets
   the right call. Ends with "You secured N of 5 messages" and a Continue button. Unlike every other
   round in this mission, it doesn't gate on getting it right; the result is just shown.
6. **Final Round — Full-Scale Transmission** (`phase: 'final'`, `FinalRoundPhase`) — a 100-cell grid
   (`FINAL_GRID_SIZE`) fills in to represent 100 photons sent at once, with one fixed cell
   (`FINAL_DISTURBED_INDEX`) revealed as disturbed. Ends with "Integrity Check: 97%" / "⚠
   Transmission Compromised" and a "Regenerate Key & Resend" button.
7. **Outcome** (`phase: 'outcome'`, `OutcomePhase`) — "Delivered Securely / No Information Leaked",
   a side-by-side classical-vs-quantum interception flow (spy copies → nobody notices, vs. spy
   measures → photon changes → receiver notices → key discarded), a lesson paragraph on why
   measurement-disturbance is a physical law rather than an engineering choice, and "Run It Back" /
   "Finish Mission".

## Key constants (`frontend/src/pages/GovernmentFilesMission.jsx`)

- `TUTORIAL_PHOTONS` / `SPY_PHOTONS` / `ROUND3_PHOTONS` — the photon emoji sets per round (5, 5, 7).
- `SPY_TARGET` / `SPY_TAMPER_MS` — which photon quietly changes color in Round 2 (index 3, 🟡→🟠) and
  how far into the drift that happens.
- `ROUND3_TARGET` — which photon is flagged as disturbed once the player scans in Round 3 (index 4, 🔴).
- `MEMORY_MESSAGES` — the five 3-photon message clusters (`ballIndices`), each independently scored;
  `MEMORY_COUNT` (15) is derived from it rather than hardcoded.
- `messageBand(messageIndex)` / `memoryLaneTop(i)` — divide the field into one horizontal band per
  message and position each message's 3 photons within its own band, with a visible gap between
  messages.
- `MEMORY_COLOR_PALETTE` / `MEMORY_ORIGINAL_COLORS` — a 9-color palette (colors repeat cyclically
  across the 15 photons, since only same-cluster distinctness matters) and each photon's starting
  color derived from it.
- `MEMORY_CHANGE_COUNT` — how many of the 15 photons (across all five messages combined) get swapped
  mid-transit (5, preserving the original ~1-in-3 ratio).
- `bouncePath(seed, startTop)` / `wavePath(seed, startTop)` — two distinct movement styles, assigned
  randomly per photon (not per message), so a cluster's three photons don't necessarily move alike.
- `MEMORY_PREVIEW_S` / `MEMORY_TRAVEL_MS` — how long the player gets to memorize the starting colors
  (4s) and the stage's overall travel window (2.7s; every photon's own animated duration, 1.0–2.4s,
  is kept strictly under this so all 15 visually finish before the stage cuts to `'deciding'`).
- `pickSwappedColor(originalColor)` — picks a swapped photon's new color from the palette excluding
  its own current color, so the end state always looks like ordinary photons and only real memory of
  the starting layout reveals which ones moved.
- `FINAL_GRID_SIZE` / `FINAL_DISTURBED_INDEX` — the 100-cell final-round grid and its one disturbed cell.
- `useMountedRef()` — the unmount guard `TutorialPhase`/`SpyPhase`'s click-triggered animations check
  after each `await`. Resets `ref.current = true` inside the effect body itself, not just via the
  initial `useRef(true)` — required so React 18 StrictMode's dev-only mount→cleanup→remount
  simulation doesn't leave it permanently `false` (see Errors/fixes below).
- `PhotonRow` — animates a row of photon emoji left-to-right along a straight line with distinct
  vertical lanes per photon; used only by `TutorialPhase` now (the "everything arrives safely"
  baseline round).
- `driftWaypoints(seed)` / `DriftingPhoton` / `PhotonField` — the looping, jitter-seeded drift
  mechanic (same idiom as Molecule Mission's `FloatingAtom`) used by `SpyPhase` and `Round3Phase`:
  photons drift continuously inside a bounded field and never pause, so identifying one is a
  track-it-while-it-moves challenge. `DriftingPhoton` optionally renders a `showDot` integrity
  indicator (green/red) and accepts `onClick`/`clickable` for Round 3's identify-by-click mechanic.
