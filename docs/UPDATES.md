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
