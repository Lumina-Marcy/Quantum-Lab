# Methods — Mini-Lesson Tracker

Tracks the "Methods" category of mini-lessons on the Resources page (`/resources`) — short,
topic-focused lessons on specific quantum algorithms/techniques, each pairing a YouTube video with
a hands-on interactive (see `docs/RESOURCES_PAGE.md` for how the Resources page and lesson data
model work in general).

Lessons live in the `lessons` table, not in frontend code — add or update one with
`server/scripts/add_lesson.py path/to/lesson.json` (see that script's docstring for the JSON shape).
The `interactive` field must match a key registered in
[`frontend/src/components/interactives/index.js`](../frontend/src/components/interactives/index.js).

## Status

| Lesson id            | Title                          | Interactive component                                                                                    | Video |
| --------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----- |
| `grovers-algorithm`   | Grover's Search Algorithm      | [`GroversAlgorithm.jsx`](../frontend/src/components/interactives/GroversAlgorithm.jsx) (key `grovers`)      | ⚠️ placeholder `videoId` |
| `quantum-gates`       | Quantum Gates & Circuits       | [`QuantumGates.jsx`](../frontend/src/components/interactives/QuantumGates.jsx) (key `quantum-gates`)        | ⚠️ placeholder `videoId` |
| `shors-algorithm`     | Shor's Algorithm               | [`ShorsAlgorithm.jsx`](../frontend/src/components/interactives/ShorsAlgorithm.jsx) (key `shors`)            | ⚠️ placeholder `videoId` |

All three lesson rows already exist in the database with their `interactive` field set correctly —
confirmed 2026-07-21 by querying the `lessons` table directly. What's still outstanding for every one
of them is a real YouTube `video_id`; each currently has the literal placeholder string
`REPLACE_WITH_YOUTUBE_VIDEO_ID`, so the embedded video on `/mission/1/learn-why`-style lesson pages
won't play yet.

## Adding a new Methods lesson

1. Build the interactive component under `frontend/src/components/interactives/` and register it in
   that folder's `index.js` under a short, unique key.
2. Author a lesson JSON file (see `add_lesson.py`'s docstring) with `"category": "Methods"` and
   `"interactive"` set to that key.
3. Run `python server/scripts/add_lesson.py path/to/lesson.json` with the server venv active to
   upsert it into the database.
4. Replace the placeholder `videoId` with a real YouTube video id before considering the lesson done.
