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
| `src/components/interactives/WaveSuperposition.jsx` | New — two-panel superposition demo for "Superposition & Entanglement": classical sound-wave addition (fundamental + overtone sliders) side by side with a quantum panel where three fixed points (`\|A⟩`, `\|B⟩`, `\|C⟩`) are met by a rising/dipping sum wave as their sliders change |
| `superposition-and-entanglement` lesson (DB row) | Added `"interactive": "wave-superposition"` via `add_lesson.py`                                    |
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

#### `wave-superposition` — used by "Superposition & Entanglement"

Two side-by-side panels contrasting the same idea — a superposition is a weighted sum — in two different settings:

- **Classical (left):** a fixed-frequency "fundamental" sine wave (blue) plus an adjustable "overtone" wave (purple, with sliders for its frequency multiple and volume); their sum is drawn in cyan — the actual combined waveform. The point: the fundamental pitch never changes as you drag the sliders, only the overtone content does — which is exactly why the same note sounds different on a violin versus a piano (same fundamental frequency, different overtone blend, different waveform/timbre).
- **Quantum (right):** three fixed points, `|A⟩`, `|B⟩`, `|C⟩`, marked with dashed guide lines along the same kind of chart as the classical panel (not a 3D projection — the two panels intentionally look alike now). Each point has a `-1` to `1` slider; each is modeled as a small Gaussian "bump" centered on that point, and the cyan curve is the *sum* of all three bumps, exactly mirroring how the classical panel sums two waves. A colored dot sits on the sum curve at each point's x-position, so you can watch the total wave visibly rise or dip to meet each point as its slider moves — the point is fixed, the wave comes to it.
- Both panels update live as sliders move; the quantum panel also prints the exact combination as text (e.g. `Result = 0.8|A⟩ + 0.5|B⟩ + -0.3|C⟩`).

No new npm dependencies were added — both charts are plain SVG, built from the same generated-path-string approach (`buildWavePath` for the classical panel's phase-based waves, `buildXYPath` for the quantum panel's position-based bumps).

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

### 9. Wave superposition interactive ("Superposition & Entanglement")

1. Go to `/resources/superposition-and-entanglement`
2. Confirm a **"Try it yourself"** card renders above the video with two panels side by side: **Classical** (a wave chart) and **Quantum** (a wave chart with three labeled points `|A⟩`, `|B⟩`, `|C⟩` on dashed guide lines)
3. On the classical panel, drag **Overtone frequency** — confirm the purple wave oscillates faster and the cyan sum wave gets visibly more complex, while the underlying fundamental (blue) is unaffected
4. Drag **Overtone volume** to `0` — confirm the cyan sum wave becomes a plain sine wave (identical to the blue fundamental)
5. On the quantum panel, drag **`|A⟩` amount** to `1.0` — confirm the cyan sum curve rises until its peak touches the top of the chart exactly at `|A⟩`'s position, and the colored dot marking that point sits on the curve
6. Drag **`|C⟩` amount** negative — confirm the curve dips *below* the center line at `|C⟩`'s position instead of rising
7. Confirm the "Result = ..." text below always matches the three slider values exactly
8. Check the browser console — there should be no errors

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
