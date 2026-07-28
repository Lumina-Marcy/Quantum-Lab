# Mission 3 — Lost Medical Breakthrough ("Build the Molecule")

## Summary of Changes

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/data/missions.js`             | Mission 3 status flipped from `'coming-soon'` to `'available'`                        |
| `frontend/src/pages/MoleculeMission.jsx`    | New — the full mission, at route `/mission/3/play`                                    |
| `frontend/src/pages/Mission.jsx`            | Generalized the preview/start flow so Mission 3 gets a working "Start Mission" button, without the Password-Mission-specific identity form |
| `frontend/src/App.jsx`                      | Registered the `/mission/3/play` route                                                |

## How it works

The player catches individual floating atoms (Carbon, Hydrogen, Nitrogen, Oxygen — LEGO-piece style)
out of a "synthesis tank" and drops them into a flask, then explicitly tests whatever mix has
accumulated there. Every different combination of atom counts (50 choices per element → 6,250,000
possible molecules) is scored by a deterministic hash, so the same formula always gives the same
result. The hardship of one-at-a-time classical search comes naturally from the mechanic itself — it
takes many individual atom-catches just to assemble *one* candidate worth testing — rather than an
artificial delay. One fixed formula is secretly the real cure, scored far above anything a hash-based
guess can produce (97% vs. a 4–60% spread for everything else), so no amount of manual mixing gets you
there by luck.

The reveal reuses the exact oracle-and-diffusion mechanic from the Grover's Algorithm lesson interactive
(same math, verified by script: 2 iterations takes the cure's measurement probability from 10% to
99.86% among 10 sampled candidates), just reskinned with molecule formulas instead of numbers — the
point being it's the same algorithm, applied to a new domain, not a new trick. Ends with a lesson
explicitly connecting this back to Mission 1's password-cracking quadratic speedup, and to real-world
quantum computing interest in pharma/materials/logistics.

## Mission flow

1. **Crisis intro** (`phase: 'intro'`) — terminal-style narration establishing the stakes: the size of
   the search space and how long classical testing would take.
2. **Synthesis Tank** (`phase: 'testing'`) — `SLOT_COUNT` single-atom bubbles drift around a bounded
   tank, each on its own deterministic path (`driftPath`, seeded by an ever-incrementing spawn id).
   Clicking a floating atom (`FloatingAtom`) collects it: status goes `floating` → `collecting` (a brief
   `COLLECT_POP_MS` pop-out) → the slot respawns a fresh atom via `generateAtom`, and the atom's element
   count increments in the **Flask** panel below. "Test This Molecule" scores the flask's current counts,
   records it in `tried`, and empties the flask for the next candidate ("Empty flask" clears it without
   testing). A running tally against the full search space and a "best so far" tracker sit below that;
   the Quantum AI CTA appears once `MIN_TESTS_BEFORE_QUANTUM` molecules have been tested. A `GuideBubble`
   ("🔬 Lab Assistant") sits beside the tank (tail pointing left at it on `sm`+ screens, stacked below
   with an upward tail on narrow ones) and nudges first-timers through their first three tests
   specifically — one line per test count (`GUIDE_MESSAGES[1..3]`) escalating from "this burns time and
   resources" to an explicit "try the Quantum AI search instead," timed to line up with the CTA appearing
   further down. The whole phase targets
   `min-h-[calc(100vh-7rem)]` with `justify-center` and compact spacing/type sizes throughout (tank
   height, badge/text sizes, panel padding) specifically so tank → flask → tally → guide/CTA all fit in
   one viewport on a typical laptop screen without scrolling.
3. **Quantum AI Search** (`phase: 'searching'`) — the Grover's-style amplitude bars, auto-playing
   through `optimalIterations` rounds of oracle-then-diffusion.
4. **Outcome** (`phase: 'outcome'`) — reveals `Compound QL-7` (C₁₇H₂₁N₃O₄), with the lesson panel and
   "Run It Back" / "Finish Mission" actions.

## Key constants (`frontend/src/pages/MoleculeMission.jsx`)

- `MAX_PER_ELEMENT` / `VALUES_PER_ELEMENT` — 0–49 per element, giving the 6,250,000-combination total.
- `CURE` / `CURE_SCORE` / `CURE_NAME` — the fixed winning formula and its guaranteed-high score.
- `scoreFor(c, h, n, o)` — deterministic hash-based scoring for every formula other than the cure (4–60% range).
- `ELEMENT_META` — symbol/name/color per element, used for both the flask badges and the floating atom bubbles.
- `SLOT_COUNT` — how many atoms float in the tank at once (9).
- `MIN_TESTS_BEFORE_QUANTUM` — how many *tested molecules* (not atom catches) unlock the "Let the Quantum AI Search" CTA (3).
- `COLLECT_POP_MS` — how long an atom's pop-out animation plays before that slot respawns.
- `CANDIDATE_SLOTS` — how many candidates the Quantum AI Search phase visualizes (10): the player's own
  tested molecules first, then the cure, then deterministic filler candidates to fill remaining slots.
