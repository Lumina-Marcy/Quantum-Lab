# Resources Page (Mini Lessons)

## Summary of Changes

| Area                                          | What changed                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/components/LessonCard.jsx`                | Card shown on the Resources list page, links to the lesson detail page                             |
| `src/pages/Resources.jsx`                      | `/resources` page, lists all lessons grouped by `category`                                         |
| `src/pages/ResourceDetail.jsx`                 | `/resources/:id` page, embeds the lesson's YouTube video and further-reading links                 |
| `src/App.jsx`                                  | Added `/resources` and `/resources/:id` routes                                                     |
| `src/components/Nav.jsx`                       | Added a **Resources** link in the nav bar next to the site title                                   |
| `src/components/interactives/BlochSphere.jsx`  | Interactive Bloch-sphere visualization; mouse position sets the qubit state and shows measurement probabilities |
| `src/components/interactives/index.js`         | Registry mapping a lesson's `interactive` key (e.g. `"bloch-sphere"`) to its React component        |
| `src/components/interactives/GroversAlgorithm.jsx` | Step-by-step Grover's search simulator; user sets a list size and target number, then steps through Oracle/Diffusion operations, with a visual scan for Oracle and a two-phase averaging/reflecting reveal for Diffusion |
| `src/components/interactives/WaveSuperposition.jsx` | New — two-panel superposition demo for "Superposition & Entanglement": classical sound-wave addition (fundamental + overtone sliders) side by side with a quantum panel |
| `src/components/interactives/WaveSuperposition.jsx` | Quantum panel rebuilt several more times — 3D vector → fixed points on a wave → a 3D field of floating dots lit by two interfering wave sources → finally replaced entirely with a single mouse-driven Bloch sphere plus two small "outcome" spheres for 0/1 (matching a user-supplied reference image) — see below |
| `src/components/interactives/WaveSuperposition.jsx` | Classical sound-wave panel removed entirely — the interactive is now just the quantum superposition/measurement panel, since the classical analogy wasn't needed once the design directly mirrors the qubit-measurement idea |
| `superposition-and-entanglement` lesson (DB row) | Title renamed from "Superposition & Entanglement" to "Superposition"; `id`/URL slug also renamed to `superposition` (so the lesson now lives at `/resources/superposition`), and `summary` cleaned up to drop its entanglement reference |
| `superposition-and-entanglement` lesson (DB row) | Added `"interactive": "wave-superposition"` via `add_lesson.py`                                    |
| `src/components/interactives/QuantumGates.jsx`  | New — circuit-builder demo for "Quantum Gates & Circuits": click `X`/`Y`/`Z`/`H`/`S` gates to build a circuit on a single qubit, see the resulting state on a Bloch-sphere-style display                    |
| `quantum-gates` lesson (DB row)                 | Added `"interactive": "quantum-gates"` via `add_lesson.py`                                          |
| `src/components/interactives/Entanglement.jsx`  | New — multi-qubit demo for a new "Entanglement" lesson: hover up to 6 independent Bloch-sphere qubits to set their odds, see the full joint probability distribution over all `2^N` outcomes, and an "Entangle qubits" toggle to contrast a genuinely correlated distribution against what independent qubits can produce |
| `entanglement` lesson (DB row)                  | New — added via `add_lesson.py`, category **Fundamentals**, `"interactive": "entanglement"`        |
| `src/components/interactives/Interference.jsx`  | New — step-by-step demo for a new "Interference" lesson, built from a user-supplied reference image: 2–4 hoverable qubits each turn into a wavefunction, the wavefunctions combine into one overall wave, and that wave determines a probability distribution over every possible answer, ending with an actual weighted "Measure!" |
| `interference` lesson (DB row)                  | New — added via `add_lesson.py`, category **Fundamentals**, `"interactive": "interference"`        |
| **Data storage migration (see below):**        |                                                                                                     |
| `db/schema.sql`                                | Added a `lessons` table (JSONB `links` column)                                                     |
| `server/app/db/models.py`                      | Added the `Lesson` SQLAlchemy model                                                                 |
| `server/app/api/lessons.py`                    | New — `GET /api/lessons` and `GET /api/lessons/{id}`                                                |
| `server/app/api/routers.py`                    | Registered the lessons router under `/api/lessons`                                                 |
| `server/scripts/add_lesson.py`                 | New — CLI to upsert one lesson into the DB from a JSON file                                         |
| `frontend/src/data/lessonsApi.js`               | New — `fetchLessons()`, `fetchLessonById(id)`, `groupByCategory()`                                  |
| `frontend/src/data/lessons/` (JSON files, `index.js`, `README.md`) | **Deleted** — superseded by the database                                       |
| `Resources.jsx` / `ResourceDetail.jsx`         | Now fetch lesson data from the API instead of reading static JSON, with loading/error states       |

---

## Why

The team wanted a place for short, topic-focused lessons ("What is a qubit?", "What methods are there?", etc.) that link out to YouTube videos. It started as static JSON files (one per lesson, auto-loaded via Vite's `import.meta.glob`) — that made adding a lesson a zero-code, zero-network operation, but as the plan grew to include many more mini-lessons *and* missions, a `src/data/lessons/` folder with dozens of files became a maintenance concern (harder to browse, easy to lose track of, and every lesson's content ends up baked into the JS bundle since `import.meta.glob` was used with `eager: true`).

So lesson content moved into the same Postgres database the app already uses for auth (`db/schema.sql` already had `missions`/`mission_steps` tables following this same "structured content in the DB" pattern — `lessons` is a natural sibling, not a new paradigm):

- Lessons live in a `lessons` table, served over `GET /api/lessons` (list) and `GET /api/lessons/{id}` (detail), following the exact same SQLAlchemy + FastAPI conventions as `server/app/api/auth.py` (`Depends(get_db)`, `HTTPException` on errors).
- The frontend fetches instead of statically importing — `Resources.jsx` and `ResourceDetail.jsx` now have loading and error states, since lesson data is no longer available synchronously at build time.
- Lessons are still grouped by their `category` field, computed client-side from whatever the API returns — new categories still "just appear" with no code changes.

### Lesson data model

```sql
CREATE TABLE IF NOT EXISTS lessons (
    id          VARCHAR PRIMARY KEY,   -- slug, e.g. 'what-is-a-qubit' — used directly in /resources/:id
    title       VARCHAR     NOT NULL,
    category    VARCHAR     NOT NULL,
    summary     TEXT        NOT NULL,
    video_id    VARCHAR     NOT NULL,
    duration    VARCHAR,
    links       JSONB       NOT NULL DEFAULT '[]'::jsonb,
    interactive VARCHAR,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The `id` is a human-readable slug rather than a `SERIAL`, specifically so the existing `/resources/:id` frontend routes didn't need to change at all during this migration. The API's JSON response aliases `video_id` → `videoId` and `links` stays an array of `{label, url}` objects — the exact same shape the old JSON files had, so `LessonCard.jsx`, `ResourceDetail.jsx`, and the `interactive` registry needed no changes beyond swapping their data source.

### Adding a new lesson

There's no file to drop in anymore — instead:

1. Author the lesson as a JSON file anywhere convenient (it's just an authoring format now, not something that gets committed):
   ```json
   {
     "id": "no-cloning-theorem",
     "title": "The No-Cloning Theorem",
     "category": "Fundamentals",
     "summary": "Why quantum information can't be copied.",
     "videoId": "REPLACE_WITH_YOUTUBE_VIDEO_ID",
     "duration": "",
     "links": [],
     "interactive": null
   }
   ```
2. Run `python server/scripts/add_lesson.py path/to/lesson.json` (from the repo root, with the server venv active). It upserts by `id` — rerunning it with the same id updates that lesson instead of duplicating it.
3. The lesson appears on `/resources` immediately (no rebuild, no restart) since the frontend fetches fresh from the API on every page load.

> **Note:** The four migrated lessons (`what-is-a-qubit`, `superposition-and-entanglement`, `quantum-gates`, `grovers-algorithm`) still have `videoId: "REPLACE_WITH_YOUTUBE_VIDEO_ID"` and empty `links` in the database — placeholders only, carried over unchanged from the original JSON files. Update them with `add_lesson.py` once real video IDs and reading links are ready; none were fabricated since they need to be verified as actually matching each topic.

### Interactive lessons (optional `interactive` field)

A lesson can opt into a custom interactive visualization by adding an `"interactive"` field whose value is a key registered in `src/components/interactives/index.js`:

```json
{
  "id": "what-is-a-qubit",
  "interactive": "bloch-sphere"
}
```

When set, `ResourceDetail.jsx` renders a **"Try it yourself"** card with that component above the video embed. To add a new interactive for a future lesson, create a component in `src/components/interactives/`, register it under a new key in `index.js`, and reference that key from the lesson's JSON — no changes needed to `ResourceDetail.jsx` itself.

#### `bloch-sphere` — used by "What is a Qubit?"

Renders a shaded 3D-looking sphere with `|1⟩` at the north pole and `|0⟩` at the south pole (a simplified [Bloch sphere](https://en.wikipedia.org/wiki/Bloch_sphere)). Moving the mouse over the sphere:

- **Vertical position** sets the qubit's polar angle (`θ`) — how close the state is to `|1⟩` vs `|0⟩`.
- **Horizontal position** sets the azimuthal angle (`φ`) — purely a phase rotation, so it does *not* change measurement probabilities (physically accurate: rotating around the vertical axis doesn't change `|c₀|²` / `|c₁|²`).
- The cyan arrow tracks the cursor in real time; below the sphere, "Most likely outcome" and `P(|1⟩)` / `P(|0⟩)` are computed as `cos²(θ/2)` and `sin²(θ/2)`.
- Moving the mouse away resets to the equator (`50%` / `50%`).

No new npm dependencies were added — the sphere shading, tilted equator ellipse, and axis are done with CSS (radial gradients, absolutely positioned divs), and the state vector is an SVG line/arrowhead overlay.

#### `grovers` — used by "Grover's Search Algorithm"

Lets the user run an actual (simplified, real-amplitude) Grover's search step by step:

- Two number inputs — **list size** (2–16) and **which number to find** — followed by **Set up list**, which (re)initializes every item to the uniform amplitude `1/√N`.
- **Next step** alternates between the two operators every click:
  - **Oracle** — flips the sign of the target's amplitude (`aₜ → -aₜ`).
  - **Diffusion** — reflects every amplitude about their average (`aᵢ → 2·mean - aᵢ`), the "inversion about the mean" step that amplifies the marked item.
- Bars animate (framer-motion, ~1.1s eased, slightly staggered) to the new probability (`amplitude²`) after each step; the target bar is highlighted cyan, and each bar's label shows its amplitude's sign (`+25%` / `−25%`), not just its probability — this is the only way to see the Oracle's sign flip, since probability alone can't show it.
- The **Next step** button disables itself and shows "Applying…" for the full ~1.1s animation, so steps can't be rushed through faster than the bars can be watched.
- A static intro paragraph explains the two-move Oracle → Diffusion loop before any step is taken.
- Below the bars: the current iteration count, which move (1 or 2) of the iteration is next, the theoretical optimal iteration count (`⌊π/4·√N⌋`), and `P(measure <target>)`.
- After each step, the explanation panel reports the *actual numbers* for that step — e.g. "3's amplitude was -0.50, below the average (0.25), so its reflection lands at 1.00" — rather than a generic per-operator caption, so the "why" is grounded in what's on screen.
- **Oracle step visually scans the list.** Before flipping the target's sign, a yellow ring sweeps across the bars one at a time (with a "checking…" label under each), stopping on the target with a red ring and "match!" label — visualizing a linear search hitting its target. The explanation panel narrates each check ("Checking number 1... not the one we want, keep going." → ... → "that's a match!"), then notes that a real quantum oracle actually checks every number at once, in superposition — the sequential scan is slowed down purely so it's watchable.
- **Diffusion step visualizes acting on everything at once**, in contrast to the Oracle's one-at-a-time scan: an **averaging** phase puts a yellow ring on every bar simultaneously with a status label above the chart ("Averaging every number at once…") and reports the real computed average; then a **reflecting** phase switches the ring to violet and the bars animate to their new heights together.
- **Optimal-step awareness:** when the upcoming Diffusion will complete the theoretically optimal iteration count, the "Next step" button turns emerald and reads "(final step!)". Once that Diffusion completes, a green banner appears confirming the probability is at its peak and that continuing is fine but will make it fall (and later rise again), since Grover's probability is periodic.
- Stepping past the optimal iteration count is allowed on purpose — Grover's probability is periodic, so continuing shows it fall back down and rise again, which is a real and useful thing to observe.

No new npm dependencies were added here either — same CSS/framer-motion toolkit as the rest of the app. The simulation is real math (not a canned animation): verified against the exact N=4 special case, where probability should cycle `25% → 100% → 25% → 25% → 100%` — confirmed to match exactly when driven in a browser.

#### `wave-superposition` — used by "Superposition"

A single panel showing a qubit in superposition and what happens when it's measured. The interactive went through several designs based on iterative feedback (a classical-vs-quantum two-panel layout with a 3D vector arrow → fixed points on a wave chart → a 3D field of floating dots lit by interfering waves → the current design, built directly from a user-supplied reference image, with the classical panel dropped entirely), documented below in order since each step's reasoning is still relevant context:

- **Current design — "Superposition & Measurement":** one main Bloch sphere (`MainQubitSphere`, reusing the exact same oblique-projection/mouse-driven mechanic as `BlochSphere.jsx` — `|1⟩` top, `|0⟩` bottom, vertical mouse position sets `θ`) sits on the left, a **→ Measurement** label in the middle, and two small static "outcome" spheres (`OutcomeSphere`) on the right — one whose arrow always points to `|0⟩` (green), one whose arrow always points to `|1⟩` (rose) — each showing its live probability as a plain percentage (`cos²(θ/2)` / `sin²(θ/2)`) next to it. Moving the mouse over the main sphere updates both percentages in real time; moving off it resets to the 50/50 default, same as the Bloch sphere lesson.
- **The classical sound-wave panel (fundamental + overtone sliders) was removed entirely.** It was originally there to contrast a classical superposition (adding two sound waves) against the quantum one, but once the quantum panel became a direct measurement diagram rather than a wave-interference visualization, the sound-wave analogy no longer illustrated the same idea side by side — it was addition working over time, this is a single qubit's odds — so it was cut rather than kept as a mismatched comparison.

**Why this design replaced the interference-field version:** the previous "field of floating dots" design was accurate physics (real 3D interference from two wave sources), but it asked a first-time, non-technical visitor to parse several unfamiliar things at once — two wave sources, animated ripples, twelve dots of varying brightness, and a "relative intensity" number — before they could even find the answer to "so what does it measure as?". That's a lot of visual vocabulary for a mini-lesson aimed at everyday internet users, most of whom have never seen a double-slit diagram. The new design fixes this in three concrete ways:
  - **One control instead of several.** There's exactly one thing to move (the main sphere's arrow) instead of a mouse-driven source plus a wavelength slider plus needing to track which of twelve dots is currently brightest.
  - **Reuses a visual the user already learned.** It's the same sphere, same `|0⟩`/`|1⟩` labels, and same mouse mechanic as the very first lesson ("What is a Qubit?"), so anyone who did that lesson already knows how to read this one — no new visual grammar to learn.
  - **The answer is stated, not inferred.** The old design required comparing dot size/brightness across a field to guess "which one is winning." The new design just shows two clearly labeled outcomes with plain percentages next to each — closer to how a coin flip or a "50/50 chance" is normally communicated, rather than an abstract physics simulation.

No new npm dependencies were added at any stage — everything is plain SVG, built from the same oblique-projection helpers used in `BlochSphere.jsx`.

#### `quantum-gates` — used by "Quantum Gates & Circuits"

A circuit builder for a single qubit, reusing the same Bloch-sphere visual language as the `bloch-sphere` interactive so the two lessons feel connected:

- Five gate buttons — `X`, `Y`, `Z`, `H`, `S` — each click appends that gate to a circuit, rendered as a small wire diagram starting from `|0⟩` with a colored box per gate in order. Clicking a gate already in the circuit removes just that one gate (the rest recomputes from the remaining sequence); **Clear circuit** resets to empty.
- The qubit's state is tracked as a real Bloch vector `{x, y, z}` (`x = ⟨X⟩`, `y = ⟨Y⟩`, `z = ⟨Z⟩`), starting at `|0⟩ = (0, 0, -1)`. Each gate is implemented as its actual rotation of that vector, not a lookup table:
  - `X`: `(x, y, z) → (x, -y, -z)` — 180° about the x-axis
  - `Y`: `(x, y, z) → (-x, y, -z)` — 180° about the y-axis
  - `Z`: `(x, y, z) → (-x, -y, z)` — 180° about the z-axis
  - `H`: `(x, y, z) → (z, -y, x)` — 180° about the `(x+z)/√2` axis
  - `S`: `(x, y, z) → (-y, x, z)` — a 90° rotation about the z-axis
- The state renders on the same oblique-projection sphere (`TILT`/`project()`) as `BlochSphere.jsx`, with `|1⟩` at the top and `|0⟩` at the bottom, plus `P(measure 0)`/`P(measure 1)` computed as `(1∓z)/2`.
- If the current vector lands within a small tolerance of one of the six cardinal states (`|0⟩`, `|1⟩`, `|+⟩`, `|−⟩`, `|+i⟩`, `|−i⟩`), that label appears above the probabilities — a nice reinforcement for recognizing common states, not just raw numbers.
- A short glossary under the gate buttons explains what each one does in plain language.

No new npm dependencies were added — same SVG/oblique-projection approach as the other interactives. The gate transforms are genuine rotation matrices (each verified orthogonal, determinant 1), not a scripted demo: e.g. `H,H` correctly returns to `|0⟩` (since `H²=I`), and `H,Z,H` correctly resolves to `|1⟩` (since `HZH=X`).

#### `entanglement` — used by the new "Entanglement" lesson

A multi-qubit demo built from a user-supplied reference image: a probability-distribution bar chart (`00`/`01`/`10`/`11`-style) next to per-qubit Bloch spheres with arrows:

- **1 to 6 qubits**, chosen with `+`/`−` buttons. Each qubit renders as its own small Bloch sphere (same oblique-projection math and mouse-driven `theta`/`phi` mechanic as `BlochSphere.jsx`, just smaller and with its own independent hover region via `e.currentTarget.getBoundingClientRect()` rather than a shared ref).
- Hovering a qubit's sphere sets its odds of measuring 0/1 live. Unlike `BlochSphere.jsx`, **a qubit's state is *not* reset when the mouse leaves it** — it keeps whatever was last set, so several qubits can hold different states at once (necessary for a multi-qubit joint distribution to be explorable at all; see the bug this fixed, below).
- The **probability distribution** chart computes the true joint probability of every `2^N` bitstring outcome as the product of each qubit's independent `P(0)`/`P(1)` — genuine math (`Math.round` display only), not illustrative bars. For `N=6` this is 64 bars, rendered in a horizontally-scrollable row.
- An **"Entangle qubits"** toggle swaps the chart to a GHZ-like correlated distribution (only all-`0`s or all-`1`s, 50/50, regardless of the individual spheres' hover states) with a callout explaining that no amount of independently tweaking each qubit can ever reproduce that pattern — this is the actual point of the lesson: entanglement is a correlation that isn't reducible to independent per-qubit probabilities.
- **Reset all** returns every qubit to the equator (50/50 default).

No new npm dependencies were added — plain SVG per qubit sphere, same oblique-projection helper functions as `BlochSphere.jsx`/`QuantumGates.jsx`, re-derived locally in this file rather than imported (matching how each interactive in this app is self-contained).

#### `interference` — used by the new "Interference" lesson

A guided, step-by-step demo built from a user-supplied reference image (a flowchart: qubits → wavefunctions → combined wavefunction → probability distribution → one measured answer), reusing the multi-qubit Bloch-sphere mechanic from `Entanglement.jsx`:

- **2 to 4 qubits**, chosen with `+`/`−` buttons (same stepper pattern as `Entanglement.jsx`), each its own small hoverable Bloch sphere in a distinct color. A qubit's state is *not* reset on mouse-leave, same reasoning as `Entanglement.jsx` — several qubits need to hold independent states at once.
- **Four guided steps** (`Next step →` / `← Back`, plus a `Start over` reset), each revealing one more layer without hiding the qubit spheres, so adjusting a qubit's state at any step immediately updates everything below it:
  1. **Set your qubits** — just the spheres.
  2. **Each qubit is a wavefunction** — reveals one wave per qubit, color-matched to its sphere. Each wave is `sin(θ) · sin((i+1)·(t − speed·time) + φ)`: `sin(θ)` is the wave's amplitude (0 at the poles — no superposition, no wave — up to 1 at the equator), `φ` is its phase (shifts the wave left/right, matching the sphere's left/right mouse position), a distinct fixed frequency per qubit index just so each one is visually distinguishable (echoing the "fundamental vs. overtone" idea from the old classical panel in `WaveSuperposition.jsx`), and a continuously-growing `time` term (driven by a `requestAnimationFrame` loop) that constantly shifts the wave sideways — so instead of a static frozen curve, each wave visibly travels the whole time it's on screen, not just while the mouse is moving over its qubit.
  3. **The waves combine into one** — the individual waves fade down (but keep traveling underneath) while a single cyan "overall wavefunction" (the average of all the qubits' waves, using that same shared, ever-increasing `time`) draws itself in once via a `framer-motion` `pathLength` animation, then keeps traveling continuously afterward exactly like the individual waves. Where two qubits' waves peak or dip together, the combined wave gets taller (constructive interference); where they oppose, it flattens out (destructive interference).
  4. **Measure an answer** — the combined wave is sampled at one evenly-spaced point per possible bitstring (`2ᴺ` points for `N` qubits), each point's value is squared and the whole set normalized to sum to 100%, producing the probability bar chart. Tall bars sit under points where the combined wave was far from zero in either direction (interference reinforced that answer); near-zero bars sit under points where it crossed zero (interference cancelled that answer out). A **Measure!** button then picks one actual outcome at random, weighted by these odds, and highlights that one bar — driving home that a real measurement always returns a single concrete answer, never the whole distribution.
- This sampling scheme is a deliberate simplification for teaching the *concept* of interference (build correct answers up, cancel wrong ones out), not a literal simulation of an `N`-qubit state vector — clearly scoped as illustrative rather than claiming to be exact quantum mechanics, the same spirit as the simplified real-amplitude Grover's simulator elsewhere in this app.

No new npm dependencies were added — same SVG/oblique-projection/framer-motion toolkit as the rest of the app.

---

## How to Test

### 1. Build check

You need both the backend and frontend running — lessons are now served from the database.

```bash
# Terminal 1 — backend
cd server
source ../.venv/bin/activate   # or your venv's activate script
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm run build   # should complete with no errors
npm run dev
```

### 2. API sanity check

```bash
curl -sL http://127.0.0.1:8000/api/lessons              # should return a JSON array of 4 lessons
curl -s http://127.0.0.1:8000/api/lessons/what-is-a-qubit  # should return that lesson's JSON
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/lessons/does-not-exist  # should print 404
```

### 3. Browse lessons

1. Go to `http://localhost:5173`
2. Click **Resources** in the nav bar (or visit `/resources` directly)
3. Confirm lessons are grouped under their category headings (**Fundamentals**, **Methods**)
4. Click **Watch & learn →** on any lesson card
5. Stop the backend and reload `/resources` — confirm you see "Couldn't load lessons. Is the backend running?" instead of a blank page or crash

### 4. Lesson detail page

1. From a lesson card, confirm you land on `/resources/<lesson-id>`
2. Confirm the page shows the title, category, summary, and an embedded video player
3. Since the starter lessons use placeholder video IDs, the embed will show YouTube's "video not found" state until real IDs are added — this is expected
4. If a lesson has `links`, confirm they render under **Further reading** and open in a new tab

### 5. Add a new lesson (no frontend file, no rebuild)

1. Write a JSON file anywhere, e.g. `/tmp/no-cloning-theorem.json`:
   ```json
   {
     "id": "no-cloning-theorem",
     "title": "The No-Cloning Theorem",
     "category": "Fundamentals",
     "summary": "Why quantum information can't be copied.",
     "videoId": "REPLACE_WITH_YOUTUBE_VIDEO_ID",
     "links": []
   }
   ```
2. Run `python server/scripts/add_lesson.py /tmp/no-cloning-theorem.json` — it should print `Added lesson 'no-cloning-theorem'`
3. Reload `/resources` (no rebuild, no dev-server restart) — confirm the new lesson appears under **Fundamentals**
4. Run the same command again with a changed `summary` — it should print `Updated lesson 'no-cloning-theorem'` and the change should show up on reload

### 6. Unknown lesson id

1. Visit `/resources/does-not-exist`
2. Confirm you see a **"Lesson not found."** message with a link back to `/resources`, instead of a crash

### 7. Bloch sphere interactive ("What is a Qubit?")

1. Go to `/resources/what-is-a-qubit`
2. Confirm a **"Try it yourself"** card renders above the video, containing a shaded sphere with `|1⟩` labeled near the top, `|0⟩` near the bottom, and a cyan arrow from the center
3. With the mouse away from the sphere, confirm the arrow rests along the equator showing `P(|1⟩) = 50%`, `P(|0⟩) = 50%`
4. Hover near the **top** of the sphere — the arrow should point toward `|1⟩` and the probability should climb toward ~99%/1%
5. Hover near the **bottom** — arrow points toward `|0⟩`, probability flips to ~1%/99%
6. Hover near the **left/right edges** (equator) — probability should return to ~50%/50% regardless of which side, since left/right only changes phase, not measurement odds
7. Move the mouse off the sphere — it should snap back to the 50/50 resting state
8. Check the browser console — there should be no errors

### 8. Grover's algorithm interactive ("Grover's Search Algorithm")

1. Go to `/resources/grovers-algorithm`
2. Confirm a **"Try it yourself"** card renders above the video, with a **list size** input, a **target number** input, a **Set up list** button, and a row of bars below (one per number)
3. Set list size to `4` and target to `3`, click **Set up list** — confirm all 4 bars show `+25%` and bar `3` is highlighted cyan
4. Click **Next step: Apply Oracle** — watch a yellow ring sweep across bars `1`, `2`, `3` in sequence with "checking…" labels, then a red ring and "match!" label land on bar `3`; the explanation panel should narrate each check, then settle on the sign-flip explanation citing `0.50` → `-0.50`. Bar `3`'s label should read `−25%` (sign flipped) while its height is unchanged
5. Click **Next step: Apply Diffusion** — a yellow ring should appear on **all four bars at once** with an "Averaging every number at once…" label above the chart, then switch to violet with a "Reflecting…" label, then bar `3` animates up to `100%` while the other three drop to `0%`; `P(measure 3)` should read `100%`, and a green "optimal number of iterations" banner should appear (since 1 iteration is optimal for a 4-item list)
6. Before clicking that Diffusion step, confirm the button read **"Next step: Apply Diffusion → (final step!)"** in emerald, since it was about to complete the optimal iteration
7. Keep clicking **Next step** — probability should drop back to `25%`, stay at `25%` for one more full iteration, then return to `100%` (the periodic N=4 special case); the optimal banner should disappear once you step past the optimal count
8. Try a larger list (e.g. `12` items, target `7`) — confirm the "optimal for this list size" hint updates (~`⌊π/4·√12⌋` ≈ 2) and stepping past it shows the probability peak then fall back down
9. Try double/triple clicking **Next step** rapidly — the disabled state during the animation should prevent skipping ahead faster than one move at a time
10. Check the browser console — there should be no errors

### 9. Wave superposition interactive ("Superposition")

1. Go to `/resources/superposition`
2. Confirm a **"Try it yourself"** card renders above the video with a single panel ("Superposition & Measurement" — a main sphere on the left, a "Measurement →" label, and two small outcome spheres on the right); there should be no classical/sound-wave panel anymore
3. With the mouse away from the main sphere, confirm both outcome spheres read `50%`
4. Hover near the **top** of the main sphere — confirm the arrow points toward `|1⟩` and the rose (`1`) outcome sphere's percentage climbs toward ~98% while the green (`0`) one drops toward ~2%
5. Hover near the **bottom** of the main sphere — confirm the arrow points toward `|0⟩` and the percentages flip (green ~98%, rose ~2%)
6. Move the mouse **off** the main sphere — confirm both outcome spheres reset to `50%`/`50%`
7. Check the browser console — there should be no errors

### 10. Quantum gates interactive ("Quantum Gates & Circuits")

1. Go to `/resources/quantum-gates`
2. Confirm a **"Try it yourself"** card renders above the video, with `X`/`Y`/`Z`/`H`/`S` gate buttons, an empty circuit row starting at `|0⟩`, and a Bloch-sphere-style display
3. Click **X** — confirm the circuit row shows one red `X` box, the arrow points to `|1⟩` (labeled), and `P(measure 1) = 100%`
4. Click **Clear circuit**, then click **H** — confirm the label reads `|+⟩` and both probabilities read `50%`
5. Click **Z** (circuit is now `H, Z`) — confirm the label changes to `|−⟩` but probabilities stay `50%`/`50%` (phase changed, not measurement odds)
6. Click **H** again (circuit is now `H, Z, H`) — confirm it resolves to `|1⟩`, `P(measure 1) = 100%`
7. Clear the circuit, click **H** twice — confirm it returns to `|0⟩`, `P(measure 0) = 100%`
8. Build a circuit of at least 2 gates, then click the **first** gate box in the circuit row — confirm only that gate is removed and the state recomputes correctly for the remaining gate(s)
9. Check the browser console — there should be no errors

### 11. Entanglement interactive ("Entanglement")

1. Go to `/resources/entanglement`
2. Confirm a **"Try it yourself"** card renders above the video, with a qubit-count stepper (starting at `2`), an **Entangle qubits** toggle, a **Reset all** button, two Bloch spheres, and a 4-bar probability distribution (`00`/`01`/`10`/`11`) all reading `25%`
3. Hover near the **top** of the first sphere (Q1) — confirm its label climbs toward ~99% and the `10`/`11` bars grow while `00`/`01` shrink toward 0%
4. Move the mouse **directly** to the second sphere (Q2) without lingering over Q1's sphere along the way, and hover near its **bottom** — confirm Q2's label drops toward ~1%, **and Q1's label stays at ~99%** (it should not reset just because the mouse moved to a different qubit)
5. Confirm the bar chart now reflects the product of both qubits' odds (e.g. `10` should be the dominant bar if Q1 favors 1 and Q2 favors 0)
6. Click **Entangle qubits** — confirm the button turns fuchsia/"Entangled ✓", a fuchsia callout appears, and the chart changes to show only `00` and `11` at `50%` each (`01`/`10` at `0%`) *regardless* of where the spheres are currently hovering
7. Click **+** four times to reach 6 qubits — confirm 6 spheres render and the distribution chart now has 64 bars (scroll to check)
8. Click **Reset all** — confirm every sphere returns to 50/50 and the distribution becomes uniform again
9. Check the browser console — there should be no errors

### 12. Interference interactive ("Interference")

1. Go to `/resources/interference`
2. Confirm a **"Try it yourself"** card renders above the video, starting at **"Step 1 of 4: Set your qubits"** with 3 hoverable spheres and a `+`/`−` qubit stepper
3. Hover a sphere near the top — confirm its label climbs toward ~99% and persists after moving to hover a different sphere
4. Click **Next step →** — confirm the step label updates to **"Step 2 of 4"** and one colored wave appears under the spheres per qubit, without hiding the spheres
5. Click **Next step →** again — confirm **"Step 3 of 4"**, the individual waves fade down, and a single cyan "Overall wavefunction" draws itself in
5b. Without touching the mouse, watch any wave (individual or combined) for a couple of seconds — confirm it keeps visibly traveling/undulating on its own rather than sitting frozen; it should already be moving the instant it's revealed, not just after you interact with a qubit
6. Click **Next step →** again — confirm **"Step 4 of 4"**, a probability-distribution bar chart appears (`2ᴺ` bars for `N` qubits), and the percentages shown sum to (approximately) 100%
7. Click **Measure!** — confirm exactly one bar gets a cyan ring/fill and a **"Measured: ###"** bitstring appears, matching that bar
8. Click **← Back** a couple of times — confirm each earlier layer disappears again without losing the qubits' hover states
9. While on any step, hover a qubit sphere again — confirm the wave / combined wave / distribution (whichever are currently visible) update live to reflect the new state
10. Click **+** to go from 3 to 4 qubits — confirm a 4th sphere appears and the distribution (if visible) grows from 8 to 16 bars
11. Click **Start over** — confirm it jumps back to Step 1 and all qubits reset to 50/50
12. Check the browser console — there should be no errors

---

## Verification Log

Manually verified on 2026-07-07 by driving the running dev server with a headless browser (Playwright + Chromium) and reading the live DOM/screenshots, rather than just reading the code:

- "Try it yourself" card and pole labels render correctly on `/resources/what-is-a-qubit`.
- Default (no hover) state: `50%` / `50%`, arrow along the equator.
- Hover near top: arrow points to `|1⟩`, **99%** / 1%.
- Hover near bottom: arrow points to `|0⟩`, 1% / **99%**.
- Hover near left and right equator edges: both settled back to `50%` / `50%`, confirming azimuthal (left/right) movement is phase-only and doesn't affect measurement odds.
- Mouse leave: cleanly resets to the 50/50 default.
- No console errors on the page.

Not yet verified: behavior on narrow/mobile viewports (the sphere is a fixed 280px, untested for overflow on small screens).

Grover's algorithm interactive, manually verified the same way on 2026-07-07:

- "Try it yourself" card, inputs, and bar chart render correctly on `/resources/grovers-algorithm`.
- Set up with N=4, target=3: all bars at 25%, target bar highlighted.
- Step 1 (Oracle): probability unchanged at 25%, as expected.
- Step 2 (Diffusion): target jumps to **100%**, others drop to 0%.
- Continued stepping matches the exact N=4 theoretical cycle: `25% → 100% → 25% → 25% → 100%`.
- No console errors on the page.

Not yet verified: very large list sizes near the 16-item cap (bar layout/readability), and narrow/mobile viewports.

Pacing/explanation follow-up, manually verified on 2026-07-07 (user feedback: the original version felt too fast and the per-step captions were too generic):

- Clicking "Next step" immediately disables the button and shows "Applying…"; confirmed it stays disabled for the full ~1.1s animation window before re-enabling.
- Confirmed the explanation message is built from the real numbers of that step, not a static caption — e.g. an Oracle step on target `3` reported "flips the sign of 3's amplitude, from 0.50 to -0.50", and the following Diffusion step correctly reported the average (`0.25`) it reflected around and the resulting value (`1.00`).
- Confirmed the per-bar label now shows the amplitude's sign (`+25%` / `−25%`), making the Oracle's sign flip visible even though bar height doesn't change.

Oracle scan visualization, manually verified on 2026-07-07 (user request: visually show how it goes through the list):

- On a 5-item list with target `4`, confirmed the yellow "checking…" ring swept across bars 1, 2, 3 in order with matching messages ("Checking number 1...", "Checking number 2...", etc.), then landed on bar 4 with a red ring, "match!" label, and the message "that's a match! In a classical search this is where we'd stop."
- Confirmed the scan halts exactly at the target rather than continuing through the rest of the list.
- Confirmed the subsequent Diffusion step still produced correct results after this change (~97% for this N=5 case, matching theory).
- No console errors.

Diffusion two-phase reveal and optimal-step notice, manually verified on 2026-07-07 (user request: do the same for Diffusion, and flag the last step):

- On a 4-item list with target `3` (optimal = 1 iteration), confirmed the button read "Next step: Apply Diffusion → (final step!)" in emerald immediately before the iteration-completing Diffusion step.
- Confirmed the averaging phase applied a yellow ring to all 4 bars simultaneously and reported the correct average (`0.25`).
- Confirmed the reflecting phase switched to a violet ring on all bars before animating to the new heights.
- Confirmed the green "optimal number of iterations" banner appeared right after that Diffusion completed, with `P(measure 3) = 100%`, and disappeared again once stepping past that iteration.
- No console errors.

Database migration, manually verified on 2026-07-08 (user request: move lesson data into the database instead of a growing JSON folder):

- Created the `lessons` table on the live Supabase DB and confirmed it via a direct `SELECT`.
- Ran `add_lesson.py` against all 4 original JSON files; confirmed via `SELECT` that all 4 rows landed with the correct fields, including `interactive` (`bloch-sphere`, `grovers`) and empty `links`/JSONB defaults.
- Deleted `frontend/src/data/lessons/` (JSON files, `index.js`, `README.md`).
- With the project's actual running dev servers (backend on :8000, frontend on :5173 — found already running, not started fresh for this test), confirmed:
  - `curl -sL http://127.0.0.1:8000/api/lessons` returns all 4 lessons as JSON with `videoId` correctly camelCased.
  - `curl http://127.0.0.1:8000/api/lessons/what-is-a-qubit` returns that lesson; `/api/lessons/does-not-exist` returns `404`.
  - `/resources` renders all 4 lesson cards grouped by category, sourced entirely from the API (no JSON files exist anymore).
  - `/resources/what-is-a-qubit` still renders the Bloch sphere interactive, and `/resources/grovers-algorithm` still renders the Grover's simulator — confirming the `interactive` field round-trips correctly through the DB.
  - `/resources/does-not-exist` still shows "Lesson not found."
  - No `pageerror`s in the browser (two expected `console` 404-network-log entries from the intentional not-found test, not JS errors).
- Not yet verified: the "Couldn't load lessons" / "Couldn't load this lesson" error states (would require stopping the backend mid-test, not done in this pass), and behavior under concurrent `add_lesson.py` runs.

**Follow-up fix (2026-07-08):** the `curl -sL` check above masked a real bug — `-L` silently follows redirects, so it didn't show that `GET /api/lessons` (no trailing slash, which is exactly what `lessonsApi.js` requests) returned a `307` to `/api/lessons/`. In the actual browser this broke: the `Location` header is an absolute URL back to the backend's own host/port, so the browser's `fetch` followed it *directly*, bypassing the Vite dev proxy entirely, turning it into a genuine cross-origin request that failed CORS. Fixed by changing the route in `server/app/api/lessons.py` from `@router.get("/")` to `@router.get("")`, so `/api/lessons` matches exactly with no redirect. Re-verified with `curl -sD -` (no `-L`, so redirects are visible) showing a direct `200`, and with a real headless-Chromium browser hitting `/resources` showing a single `200` response through the proxy, zero failed requests, zero console errors.

**Follow-up (2026-07-08):** `missions.py` and `resources.py` had the same `@router.get("/")` pattern — no frontend code calls either endpoint today (mission data is hardcoded in `Home.jsx`/`Mission.jsx`, and the old `/api/resources` stub predates this page and is unrelated to `/api/lessons`), so this was latent rather than a live bug, but fixed both the same way (`@router.get("/")` → `@router.get("")`) so the whole API is consistent. Verified `GET /api/missions` and `GET /api/resources` both now return `200` directly (via `curl -sD -`, redirects visible) with no `307`.

Separately, while touching `server/` for this task, found and fixed a pre-existing repo hygiene issue unrelated to lessons: `server/.venv/` (the entire Python virtual environment, ~3,924 files / 120MB) and several `server/app/**/__pycache__/*.pyc` files were tracked in git. Added `__pycache__/`, `*.py[cod]`, and `.venv/` to `.gitignore` and ran `git rm -r --cached` on both — files remain on disk, just untracked. This is a large `git status`/diff by file count but touches nothing functional.

Wave superposition interactive, manually verified on 2026-07-08 (user request: a two-sided demo — classical wave overtones vs. quantum 3D vector blending):

- Updated the `superposition-and-entanglement` DB row's `interactive` field to `"wave-superposition"` via `add_lesson.py`.
- On `/resources/superposition-and-entanglement`, confirmed both panels render: the classical wave chart (fundamental/overtone/sum) and the quantum vector diagram (`|A⟩`/`|B⟩`/`|C⟩` axes + resultant arrow).
- Moved the classical **overtone frequency** slider and confirmed the SVG path data for the sum wave actually changed (compared the `d` attribute before/after, not just a visual glance).
- Moved a quantum coefficient slider (`|A⟩ amount` to `-1`) and confirmed the "Result = ..." text updated to reflect the new value and the vector's length changed accordingly.
- No console errors.

**Follow-up (2026-07-08):** user asked for the quantum panel to be redesigned — fixed points that the sum wave visibly moves toward, rather than an abstract 3D vector. Replaced `QuantumPanel`'s vector-arrow diagram with a second wave chart: `|A⟩`/`|B⟩`/`|C⟩` are fixed x-positions (dashed guide lines) each contributing a Gaussian "bump" scaled by its slider, summed into the same kind of cyan curve as the classical panel. Manually verified:

- Set `|A⟩ amount` to `1.0` — confirmed via a Playwright DOM check that the colored point-marker circle's `cy` attribute changed (moved from `~18.8` to `~6.0`, i.e. up toward the top of the chart) and screenshots showed the cyan curve's peak exactly meeting that point.
- Confirmed a negative coefficient (`|C⟩ amount = -0.3`) makes the curve dip *below* the center line at that point instead of rising, visible in the same screenshot.
- No console errors.

**Follow-up (2026-07-10):** user asked for something closer to the original request — an actual quantum space of dots floating, with waves passing through them, highlighting the most likely correct state, rather than a flat wave chart. Replaced the "fixed points on a wave" design with a 2D interference field: 12 fixed dots, two wave sources (fixed + a second one), intensity at each dot computed from real 2D distance-based interference (phasor sum, `(re²+im²)/4`), with animated SVG ripples. Manually verified:

- Confirmed all 12 dots render with size/brightness proportional to computed intensity, and the highest-intensity dot gets a pink ring labeled "Most likely: State N".
- **Caught a real bug during verification:** one dot happened to sit exactly on the perpendicular bisector between the two sources, which is *always* the interference maximum regardless of wavelength/separation — so it won every single time, making the sliders look broken/unresponsive. Fixed by nudging that dot's position off the bisector, then re-verified computationally (a standalone Node script sweeping wavelength × separation combinations) that the winning dot genuinely varies across the parameter space (confirmed 5+ distinct winners across different settings), not just cosmetically in the browser.

**Follow-up (2026-07-10):** user asked for direct mouse control — "the user moves a point with their mouse and the result wave will change" — instead of a slider for source separation. Replaced the "distance between sources" slider with a mouse-tracked second source: `onMouseMove` over the field updates its position continuously (same pattern as `BlochSphere.jsx`), `onMouseLeave` resets it to a default center position. Manually verified with Playwright mouse movement to multiple field positions: confirmed the "Most likely" state changed across different cursor positions, and confirmed it reset to the default on mouse-leave.

**Follow-up (2026-07-10):** user asked to "make it 3D". Added a `z` (and reused the mouse-driven source's implicit depth) via the same oblique projection (`TILT`, `project(x, y, z)`) already used in `BlochSphere.jsx`, so all interactives share one visual language for "3D-looking" elements. Each of the 12 dots now has a real `{x, y, z}` position; interference intensity is computed from genuine 3D Euclidean distance (not a 2D approximation dressed up to look 3D), and each dot's rendered size/opacity additionally scales with its depth for a parallax cue. Manually verified: all dot screen positions stayed within the visible canvas bounds after adding the depth axis (checked all rendered `cx`/`cy` values programmatically, not just a visual glance), and the interference pattern still responded correctly to mouse movement after the change.

**Note:** a store-analogy rewrite of the Grover's algorithm explanations was tried on 2026-07-10 (simplifying the amplitude/probability language into a "bags on a shelf, cashier, manager" scenario) but was reverted at the user's request — `GroversAlgorithm.jsx` and this doc's `grovers` section are back to their original wording.

Quantum gates interactive, manually verified on 2026-07-10 (user request: an interactive lesson for "Quantum Gates & Circuits" where users can build a circuit and explore outcomes):

- Updated the `quantum-gates` DB row's `interactive` field to `"quantum-gates"` via `add_lesson.py`.
- Drove `/resources/quantum-gates` end to end with a headless browser and checked every gate combination against the expected physics, not just that something rendered:
  - Initial state: `|0⟩`, `P(measure 0) = 100%`.
  - `X` → `|1⟩`, `100%`/`0%` reversed.
  - `H` → `|+⟩`, `50%`/`50%`.
  - `H, Z` → `|−⟩`, still `50%`/`50%` (confirms Z changes phase, not measurement odds).
  - `H, Z, H` → `|1⟩`, `100%` (confirms `HZH = X`).
  - `H, H` → `|0⟩`, `100%`/`0%` (confirms `H² = I`).
  - `H, X` → `|+⟩` unchanged (confirms `|+⟩` is invariant under `X`, as expected physically).
  - Removing the first gate from a `[H, X]` circuit correctly left just `[X]` → `|1⟩`.
- **Caught a real bug during verification:** `motion.line` animating `x2`/`y2` directly threw two console errors ("Expected length, undefined") on every render. Replaced it with a plain `<line>` (same approach `BlochSphere.jsx` already uses for its arrow) and re-verified zero console errors across the entire gate-combination sweep above.

Entanglement interactive, manually verified on 2026-07-10 (user request, from a reference image: hover-driven multi-qubit probability distribution, up to 6 qubits):

- Added the new `entanglement` lesson (category Fundamentals) to the DB via `add_lesson.py`, with `"interactive": "entanglement"`.
- Confirmed the default state (2 qubits, no hover) shows a perfectly uniform `25%/25%/25%/25%` distribution — the correct product of two independent 50/50 qubits.
- Hovered Q1 near the top (→ ~99%) and checked the joint distribution matched the product of the exact underlying angles precisely (down to the sub-percent level, not just "roughly right").
- **Caught and fixed a real design bug during verification:** the first version copied `BlochSphere.jsx`'s reset-on-mouse-leave behavior, so only one qubit could ever hold a non-default state at a time — moving to hover a second qubit silently reset the first back to 50/50, defeating the entire point of a multi-qubit joint distribution. Removed the reset-on-leave behavior so each sphere keeps its last-set value independently.
- Re-verified the fix using an **instant** mouse jump (`steps: 1`) rather than an animated multi-step move between the two spheres — this distinction mattered: an animated move that transits *through* a sphere on the way to another correctly (and expectedly) disturbs it along the way, which isn't a bug, so the real test of "does it persist" requires jumping straight to the target without crossing the first sphere. After the fix, confirmed Q1 stayed at ~99% while Q2 was set independently to ~1%, and the joint distribution matched the product of both to within rounding.
- Confirmed the **Entangle qubits** toggle produces exactly the GHZ-like `50%/0%/0%/50%` pattern regardless of the spheres' current hover states, and reverts to the independent product when toggled off.
- Confirmed the qubit-count stepper correctly renders 6 spheres and 64 (`2⁶`) distribution bars when maxed out.
- No console errors.

**Follow-up (2026-07-15):** user supplied a new reference image and asked for the quantum panel to instead show one qubit splitting into two separate outcome spheres for 0 and 1, still mouse-driven. Replaced the interference-field `QuantumPanel` entirely with `MainQubitSphere` (identical mouse mechanic/oblique projection to `BlochSphere.jsx`) plus two static `OutcomeSphere` instances (green → `|0⟩`, rose → `|1⟩`), each displaying `cos²(θ/2)`/`sin²(θ/2)` live. Manually verified with a headless browser:

- Default (mouse away from the sphere): `50% | 50%`.
- Hover near the top of the main sphere: `2% | 98%` (favors `|1⟩`, as expected — top is `|1⟩`).
- Hover near the bottom: `98% | 2%` (favors `|0⟩`).
- Mouse leave: cleanly reset back to `50% | 50%`.
- Screenshot compared against the reference image — layout matches (main sphere, arrow, "Measurement →" label, two labeled outcome spheres with percentages).
- No console errors across the full interaction sequence.

This also removed the last of the wave-interference-specific code from `WaveSuperposition.jsx` (dot fields, ripple `<animate>` elements, wavelength slider) — the quantum panel is now purely two `BlochSphere.jsx`-style components, so it shares its entire visual vocabulary with the "What is a Qubit?" and "Entanglement" lessons instead of having its own one-off physics visualization.

**Follow-up (2026-07-15):** user asked to drop the classical sound-wave panel entirely and let the interactive just be the superposition/measurement panel. Removed `ClassicalPanel`, `WaveChart`, and `buildWavePath` from `WaveSuperposition.jsx` along with their unused constants (`WAVE_WIDTH`/`WAVE_HEIGHT`/`CYCLES`/`SAMPLES`); the component now renders `QuantumPanel` directly instead of a two-column grid. Also removed the now-orphaned "Quantum" eyebrow label above the panel heading, since it existed only to contrast against the (now-deleted) "Classical" panel. Verified `npm run build` completes with no errors both immediately after removing the classical panel and after the follow-up label cleanup.

**Follow-up (2026-07-15):** user asked to rename the lesson from "Superposition & Entanglement" to "Superposition" — a natural cleanup since Entanglement now has its own dedicated lesson and this one's interactive no longer touches entanglement at all. Then asked to finish the cleanup: also rename the `id`/URL slug and fix the summary text. Since `add_lesson.py` upserts by `id` (changing the id in a JSON file would just create a second row rather than rename the existing one), the `id` rename and summary edit were done with a one-off script updating the existing `Lesson` row's `id` from `superposition-and-entanglement` to `superposition` and its `summary` from "...and how entangled qubits stay linked." to "...and what happens when you measure one." — dropping the now-redundant entanglement reference. Confirmed no other file in the repo hardcoded the old slug (`grep -rl superposition-and-entanglement`, only this doc matched) before renaming it, so no other code needed updating. Verified: `curl .../api/lessons/superposition-and-entanglement` now returns `404`, `curl .../api/lessons/superposition` returns the lesson with the new `id`, `title: "Superposition"`, and the cleaned-up `summary`, and the total lesson count via `GET /api/lessons` stayed at 5 (confirming this was a rename, not an accidental duplicate row).

Interference interactive, manually verified on 2026-07-15 (user request, from a reference image: qubits turn into wavefunctions, the wavefunctions combine, and the combined wave produces a probability distribution, guiding the user through the steps):

- Added the new `interference` lesson (category Fundamentals) to the DB via `add_lesson.py`, with `"interactive": "interference"`.
- Drove `/resources/interference` end to end with a headless browser:
  - Default state: 3 spheres at 50/50, step label "Step 1 of 4: Set your qubits".
  - Hovered Q1 near the top — its label read 98%, and it stayed there through the rest of the walkthrough (confirming the no-reset-on-leave behavior carried over correctly from `Entanglement.jsx`).
  - Step 2: confirmed 6 total `<svg>` elements on the page (3 qubit spheres + 3 individual waves) — the wave panel genuinely rendered one wave per qubit, not a placeholder.
  - Step 3: confirmed the "Overall wavefunction" panel appeared.
  - Step 4: confirmed exactly 8 bars for 3 qubits, labeled `000`–`111`, with percentages `24% 1% 1% 24% 24% 1% 1% 24%` — summing to 100% after rounding.
  - Clicked **Measure!** — got `Measured: 100`, matching one of the two currently-tied 24% bars, confirming the weighted-random pick genuinely samples from the displayed distribution rather than always picking the same bar.
  - Increased to 4 qubits — sphere count became 4 and the bar count became 16 (`2⁴`), confirming the distribution recomputes correctly at every qubit count in the 2–4 range.
  - Clicked **Start over** — confirmed it returned to "Step 1 of 4".
  - Confirmed the final-step **Next step →** button is genuinely `disabled` (not just visually dimmed) via `isDisabled()`, so stepping can't run past the last step.
  - Full-page screenshot confirmed the visual flow (qubits → individual wavefunctions → single combined wavefunction → probability bars → Measure!) matches the structure of the reference image.
  - No console errors across the entire walkthrough.

**Follow-up (2026-07-15):** user asked for the waves to visibly move — draw in from start to end, then keep "waving" continuously — rather than sitting as static frozen curves. Added a `requestAnimationFrame` loop (gated to run only while step ≥ 1, i.e. only while any wave is on screen) that continuously advances a shared `time` value; every wave's phase now includes a `− speed·time` term, so the whole curve visibly travels sideways for as long as it's visible, not just in response to mouse movement. Kept the existing one-time `pathLength` draw-in animation on both the individual waves (on first reveal) and the combined wave (on first reveal), so each wave still animates in from nothing before settling into its continuous travel. Manually verified:

- Read the `d` attribute of an individual wave's `<path>` twice, 500ms apart, with no mouse interaction — confirmed it changed both times, and kept changing 3 seconds later, i.e. it never stops on its own.
- Same check on the combined "Overall wavefunction" path — confirmed it also keeps changing continuously, and does **not** replay its draw-in animation on every frame (this was a real risk: the previous implementation keyed the combined wave's `motion.path` by the path string itself, which would have forced a full remount — and a fresh 0%-drawn restart — on every single animation frame; fixed by dropping that `key` so the path element persists across re-renders and only its `d` attribute updates).
- Confirmed hovering a qubit sphere still immediately reshapes its wave (and the combined wave) on top of the ongoing travel animation, and that navigating Back to step 1 and Next again still works, replaying the draw-in as expected.
- No console errors.
