# Quantum-Lab

## Hypothesis

We believe that experiential learning is the missing link in quantum education. By allowing users to see, interact with, and experiment with quantum concepts through familiar real-world problems, we can make quantum computing understandable to anyone regardless of technical background.

Quantum Quest is an interactive educational platform that helps everyday people understand quantum computing through visual storytelling and simulation.
Rather than teaching equations or theory, we allow users to experience how quantum computers approach problems differently than traditional computers.
Through missions focused on cybersecurity, search, healthcare, and logistics, users gain an intuitive understanding of one of the most important technologies shaping the future.

Our goal is simple: **make quantum computing understandable in five minutes or less.**

## Project Description

*Rather than teaching equations, we teach through experience.*

**Quantum Lab — Experience the Future of Problem Solving**

An interactive learning experience that helps everyday people understand quantum computing through stories, simulations, and hands-on exploration.

Rather than teaching complex mathematics or physics, Quantum Quest transforms abstract quantum concepts into relatable experiences. Users step into real-world scenarios from protecting a password vault to finding a critical file in a massive warehouse and discover how quantum computers approach problems differently from traditional computers.

Through interactive simulations, decision-making challenges, and visual comparisons between classical and quantum approaches, users learn not only how quantum computing could impact cybersecurity, but also how it could transform fields such as healthcare, logistics, finance, and scientific discovery.

Our goal is to make one of the most important emerging technologies of the 21st century understandable to anyone, regardless of technical background.

## Flow

**Home**
"What if computers could explore many possibilities at once?"
↓
**Choose a Mission**
- Mission 1: The Password Vault — Learn how encryption works and why quantum computing challenges current security systems.
- Mission 2: Find the Exit — Navigate a maze using both classical and quantum search.
- Mission 3: Lost Medical Breakthrough — Search millions of molecular combinations to find a life-saving treatment.
- Mission 4: The Supply Chain Crisis — Optimize routes and deliveries across a complex logistics network.
↓
**1-Minute Interactive Experience**
The user plays through a scenario.
↓
**Decision Point**
The user chooses strategies.
↓
**Outcome**
Consequences unfold.
↓
**How Did The Computer Think?**
This is where the side-by-side comparison lives.

**Classical Search:**
- Checking Path #1...
- Checking Path #2...
- Checking Path #3...

**Quantum Search:**
- Exploring possibilities...
- Amplifying correct solution...
- Probability: 87%

Visual animations make this intuitive.

## User Personas / Audience

Our intended audience is everyday internet users, students, young professionals, and individuals who regularly use online services but have limited knowledge of cybersecurity and quantum computing. They value privacy, security, and protecting their personal information, but often assume that current security measures are sufficient.

The problem they face is a lack of awareness about how advances in quantum computing could threaten the encryption systems that currently protect passwords, banking information, medical records, and online communications. While many users have heard of cybersecurity risks, quantum computing remains a complex and unfamiliar topic that is difficult to understand through traditional articles, videos, or technical explanations.

Our solution provides an interactive simulation and sandbox environment that allows users to visualize these threats, experiment with security concepts, and learn about quantum-resistant technologies in an engaging and accessible way. By making abstract cybersecurity risks tangible, we help users better understand and prepare for the future of digital security.

## User Stories

### MVP
*Without these features, the application will not be useful*

- As a User, I can enter sample personal data at the start and see it exposed throughout the scenario, making the cybersecurity risks feel personal and tangible.
- As a User, I can make decisions throughout a scenario and immediately see the consequences of those choices.
- As a User, I can receive an explanation after each story that connects the scenario to real-world quantum computing and cybersecurity risks.
- As a User, I can visually compare how a classical computer and a quantum computer approach the same problem so I can understand the difference without needing technical knowledge.
- As a User, I can complete a real-world mission in under five minutes and walk away with a practical understanding of a quantum concept.

### Stretch Features
*When time is running short, these features will get cut*

- As a User, I can play a scenario-matched quantum game after completing a story that reinforces the concept I just learned.
- As a User, I can earn a Quantum Readiness Score based on decisions made across multiple scenarios.
- As a User, I can unlock additional scenarios covering banking, healthcare, government systems, and personal privacy risks.
- As a User, I can explore a sandbox environment where I can experiment with different security scenarios, encryption methods, and quantum attack simulations to deepen my understanding of quantum-resistant encryption and how to protect data in a post-quantum world.

---

## Part II — Technical Specifications

### Schema Design

Document the tables required for your project. For each table, include the name of the table, the field names, and any relevant constraints. Below is an example of a simple todo application's schema.

#### `users` table

| Field           | Constraints                          |
| --------------- | ------------------------------------- |
| user_id         | SERIAL PRIMARY KEY                    |
| username        | TEXT UNIQUE NOT NULL                  |
| email           | TEXT UNIQUE NOT NULL                  |
| created_at      | TIMESTAMP DEFAULT CURRENT_TIMESTAMP   |
| password_hash   | TEXT NOT NULL                         |

#### `missions` table

| Field           | Constraints                          |
| --------------- | ------------------------------------- |
| mission_id      | SERIAL PRIMARY KEY                    |
| title           | TEXT NOT NULL                         |
| description     | TEXT NOT NULL                         |
| difficulty      | TEXT NOT NULL                         |
| estimated_time  | INTEGER NOT NULL                      |
| created_at      | TIMESTAMP DEFAULT CURRENT_TIMESTAMP   |

#### `mission_steps` table
*Stores each screen within a mission*

| Field       | Constraints                                              |
| ----------- | ---------------------------------------------------------- |
| step_id     | SERIAL PRIMARY KEY                                        |
| mission_id  | INTEGER REFERENCES missions(mission_id) ON DELETE CASCADE |
| step_order  | INTEGER NOT NULL                                          |
| title       | TEXT NOT NULL                                              |
| content     | TEXT NOT NULL                                              |
| step_type   | TEXT NOT NULL                                              |

#### `user_choices` table
*Stores choices made throughout scenarios*

| Field           | Constraints                                                    |
| --------------- | ----------------------------------------------------------------- |
| choice_id       | SERIAL PRIMARY KEY                                              |
| user_id         | INTEGER REFERENCES users(user_id) ON DELETE CASCADE             |
| mission_id      | INTEGER REFERENCES missions(mission_id) ON DELETE CASCADE       |
| step_id         | INTEGER REFERENCES mission_steps(step_id)                       |
| selected_option | TEXT NOT NULL                                                    |
| created_at      | TIMESTAMP DEFAULT CURRENT_TIMESTAMP                              |

#### `sandbox_runs` table
*Stores user experiments in the Quantum Lab Sandbox*

| Field             | Constraints                                          |
| ------------------ | ------------------------------------------------------- |
| run_id             | SERIAL PRIMARY KEY                                     |
| user_id            | INTEGER REFERENCES users(user_id) ON DELETE CASCADE    |
| simulation_type    | TEXT NOT NULL                                          |
| search_space_size  | INTEGER NOT NULL                                       |
| algorithm_type     | TEXT NOT NULL                                          |
| classical_steps    | INTEGER NOT NULL                                       |
| quantum_steps      | INTEGER NOT NULL                                       |
| created_at         | TIMESTAMP DEFAULT CURRENT_TIMESTAMP                    |

### API Contract

Document each available endpoint for your application including:
- The method type and endpoint path (include path parameters)
- A brief description
- Request information including the body structure and any optional query strings. Provide default values for optional request body fields.
- Response information including success/error response structures and status codes

#### Example — Todo App

Below is an example of a simple todo application's API contract with three endpoints:

##### `GET /api/todos`
Returns all todos in an array of objects.

**Request:**
- Body: None
- Optional `?complete=true` or `?complete=false` query string to filter by completion status

**Response:**
- Success: `[{ id, title, isComplete }, {...}, …]` — `200`

##### `GET /api/todos/:id`
Returns a single todo object based on the given id.

**Request:**
- Body: None

**Response:**
- Success: `{ id, title, isComplete }` — `200`

##### `POST /api/todos`
Creates and returns new todo object.

**Request:**
- Body: `{ title, isComplete=false }`
- A title is required. `isComplete` is optional, defaulting to `false` when not provided.

**Response:**
- Success: `{ id, title, isComplete }` — `200`
- Error, Not Authenticated: `{ message }` — `401`
- Error, Unauthorized: `{ message }` — `403`

#### Auth

##### `POST /api/auth/register`
Creates a new user account.

**Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```
All fields are required.

**Response:**
- Success — `201`
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "string"
  }
  ```
- Error – Bad Request — `400`
  ```json
  { "message": "Missing required fields" }
  ```
- Error – Conflict (email exists) — `409`
  ```json
  { "message": "User already exists" }
  ```

##### `POST /api/auth/login`
Authenticates a user and creates a session/token.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```
Both fields are required.

**Response:**
- Success — `200`
  ```json
  {
    "id": 1,
    "username": "string",
    "token": "jwt-token"
  }
  ```
- Error – Unauthorized — `401`
  ```json
  { "message": "Invalid credentials" }
  ```

##### `POST /api/auth/logout`
Logs out the current user.

**Request:**
- Body: None
- Requires authentication

**Response:**
- Success — `200`
  ```json
  { "message": "Logged out successfully" }
  ```
- Error – Not Authenticated — `401`
  ```json
  { "message": "User not logged in" }
  ```

#### Missions

##### `GET /api/missions`
Returns all available missions.

**Request:**
- Body: None
- Optional query: `?difficulty=beginner|intermediate|advanced`

**Response:**
- Success — `200`
  ```json
  [
    {
      "id": 1,
      "title": "Password Vault",
      "description": "Learn encryption and quantum threats",
      "difficulty": "beginner"
    }
  ]
  ```

##### `GET /api/missions/:id`
Returns a single mission.

**Request:**
- Body: None
- Path Params: `id` (required)

**Response:**
- Success — `200`
  ```json
  {
    "id": 1,
    "title": "Password Vault",
    "story": "A system is under attack...",
    "difficulty": "beginner"
  }
  ```
- Error – Not Found — `404`
  ```json
  { "message": "Mission not found" }
  ```

##### `GET /api/missions/:id/result/:sessionId`
Returns final simulation outcome.

**Request:**
- Body: None
- Path Params: `id` (mission id), `sessionId`

**Response:**
- Success — `200`
  ```json
  {
    "missionId": 1,
    "sessionId": "abc123",
    "outcome": "success",
    "userChoice": "strong_encryption",
    "probability": 87,
    "classicalSimulation": [
      "Checking key 1...",
      "Checking key 2..."
    ],
    "quantumSimulation": [
      "Exploring states...",
      "Amplifying result..."
    ],
    "explanation": "Quantum computing explores multiple states at once."
  }
  ```
- Error – Not Found — `404`
  ```json
  { "message": "Session not found" }
  ```

#### Sandbox

##### `GET /api/sandbox/options`
Returns available simulation settings.

**Request:**
- Body: None

**Response:**
- Success — `200`
  ```json
  {
    "modes": ["encryption", "search", "optimization"],
    "computerTypes": ["classical", "quantum"],
    "sizes": ["small", "medium", "large"]
  }
  ```

#### Resources

##### `GET /api/resources`
Returns learning content.

**Request:**
- Body: None

**Response:**
- Success — `200`
  ```json
  {
    "intro": "Learn quantum computing basics",
    "topics": [
      { "title": "What is a Qubit?", "type": "article" },
      { "title": "Superposition Explained", "type": "video" }
    ],
    "glossary": [
      "qubit",
      "entanglement",
      "superposition",
      "quantum advantage"
    ]
  }
  ```

### Wireframe

*(placeholder — add wireframe images/links here)*

### Core Technologies, 3rd-Party APIs and New Libraries

This project will make use of the following technologies, 3rd-Party APIs, and new libraries:
- React for the frontend user interface
- Python and FastAPI for the server
- Postgres for the database

#### Core Technologies

**React**
React will be used to build the frontend user interface, including the interactive story system, decision-making screens, password vault demonstration, quantum sandbox, and educational comparison views.

**Python**
Python will be used to develop the backend logic, including the story engine, quantum risk calculations, user progress tracking, and simulation processing.

**FastAPI**
FastAPI will provide REST API endpoints for retrieving stories, processing user choices, running sandbox simulations, and storing user progress. FastAPI is lightweight, fast, and includes automatic API documentation.

**PostgreSQL**
PostgreSQL will store user accounts, story completions, decision history, sandbox simulation results, and Quantum Readiness Scores.

#### New Libraries

**SQLAlchemy**
SQLAlchemy will be used as the Object Relational Mapper (ORM) between FastAPI and PostgreSQL, simplifying database interactions and model creation.

**Pydantic**
Pydantic will validate incoming and outgoing API data, ensuring request and response structures remain consistent throughout the application.

**Framer Motion**
Framer Motion will power animations throughout the application, including scene transitions, terminal effects, progress indicators, and visual feedback during quantum attack simulations.

**Tailwind CSS**
Tailwind CSS will be used to rapidly build a responsive cyber-security themed interface while maintaining consistent styling across the application.

**React Router**
React Router will manage navigation between the Home page, Story pages, Learning screens, Results pages, and Sandbox mode.

**React Type Animation**
React Type Animation will create terminal-style typing effects for the quantum attack simulator and educational comparison screens.

#### External Services / APIs

**No External APIs Required for MVP**
The application's stories, simulations, and educational content will be generated internally rather than relying on third-party APIs. This ensures a reliable and fully controlled educational experience.

#### Optional Stretch Integrations

**Chart.js**
Chart.js may be used to visualize risk scores, encryption comparisons, and Quantum Readiness metrics through interactive charts and graphs.

**OpenAI API (Stretch Feature)**
The OpenAI API may be integrated to generate additional educational explanations, scenario variations, or adaptive learning content based on user decisions within the simulation.

### Rationale

The selected technology stack supports an interactive educational platform that combines storytelling, simulation, and cybersecurity awareness. React and FastAPI provide a modern full-stack architecture, PostgreSQL enables persistent user progress tracking, and the supporting libraries enhance the user experience through animations, routing, validation, and data visualization.

---

## Project History & Current State

*The sections above describe the project as originally planned. Since then the app has been built out substantially. This section, drawn from the engineering logs in `docs/`, summarizes what actually changed and how the app works today.*

### What Changed

#### Data model migration: from static frontend files to Postgres
Early in the project, both lessons and missions were hardcoded in the frontend: lessons were one JSON file each under `frontend/src/data/lessons/` (auto-loaded via Vite's `import.meta.glob`), and missions were a plain array in `frontend/src/data/missions.js` plus a dead stub in `server/app/api/missions.py`. As the lesson catalog grew, the JSON-file approach got harder to maintain (every lesson baked into the JS bundle, hard to browse). Lessons moved into a new `lessons` table in Postgres/Supabase (`db/schema.sql`), served via `GET /api/lessons` and `GET /api/lessons/{id}` (`server/app/api/lessons.py`), with `server/scripts/add_lesson.py` as the upsert-by-id authoring tool. `db/schema.sql` already had `missions`/`mission_steps` tables at that point (lessons' schema was modeled on missions'), but missions themselves weren't migrated until later: `server/app/api/missions.py` was rewritten to run real DB queries mirroring `lessons.py`'s pattern, `missions.estimated_time` changed from `INTEGER` to `VARCHAR` (for display labels like `"~1 min"`), and `status`/`terminal_lines` (JSONB) columns were added. `frontend/src/data/missions.js` is now just `STATUS_LABELS`, and `MissionGrid.jsx`/`Mission.jsx` fetch from the API with loading/error states, same as `Resources.jsx`.

#### Auth
Built on FastAPI + SQLAlchemy + bcrypt + JWT (`server/app/api/auth.py`): register (optional username, auto-generated as `firstname.lastname` on collision), login, logout, `GET /me`, `PATCH /account`, `DELETE /account`. It picked up `first_name`/`last_name` columns, a 30-day cooldown on username changes, a `remember_me` preference (`1_day`/`1_week`/`1_month`) that drives token expiry and is editable in Settings, and a requirement that username/password/email changes (and account deletion) re-verify the current password server-side. On the frontend, session-expiry handling ended up two-layered: an `authFetch` wrapper that redirects to `/login` on any 401, plus a proactive check in `AuthContext.jsx` that decodes the JWT's `exp` client-side and polls it every 30s, so an idle logged-in tab doesn't sit silently expired.

#### Mission evolution
- **Mission 1 (Password Vault)** started as a breach → 3-card-defense → outcome flow, then had its post-"Start Mission" gameplay replaced with a richer breach → multi-account triage/vault/2FA-minigame → aftermath flow. Its "Lock In My Data" form used to call the real `/api/auth/register` endpoint to simulate saving personal data (which risked creating a real account); it now requires the visitor to already be logged in and just stores the sample data locally.
- **Mission 2 (Maze Search)** has the player first solve a maze solo (classical: one path at a time, backtracking out of dead ends), then re-run the same maze "quantum" style, where every junction splits their token into one branch per path, until one branch reaches the exit and all others collapse away as "the measurement." It picked up two crash-bug fixes where a leftover `useEffect` referenced nonexistent variables/phase names and `DirectionPad` spread an undefined `hoverProps`, both left over from an earlier refactor into separate classical/quantum runs that never got fully cleaned up.
- **Mission 3 (Lost Medical Breakthrough / "Build the Molecule")**: catch floating atoms into a flask, test candidate molecule formulas (6.25M possible combinations, deterministically scored), then hand off to a quantum search phase that runs the same oracle-and-diffusion mechanic as the Grover's-algorithm lesson interactive, reskinned with molecule formulas.
- **Mission 4 (Supply Chain Crisis / "Reroute the Network")** went through three full gameplay rebuilds in a single day, more than any other mission. It started by reusing Mission 3's catch-and-combine mechanic, got stripped to bare navigation, then became "Warehouse Chaos": a 60-second real-time drag-and-drop dock-scheduling minigame (deadlines, workers, robots, random disruptions) that feeds real "before" numbers into the same Grover's-style amplitude reveal. That reveal step was cut and then restored as a simpler `SimulationPhase`, a live round-counter/satisfaction readout grounded in real `optimalIterations` math.
- **Mission 5 (Government Files / "Quantum Key Distribution")** was built out into a full 7-phase mission: a clean tutorial transmission, an interception round, a scan-and-click interception round, a 5-message memory-check round, a 100-photon final round, and an outcome comparing classical vs. quantum interception. Every animated sequence is click-triggered rather than a mount effect, guarded by a mounted-ref check, to avoid an auto-timer bug that had plagued an earlier mission's design.
- **`Mission.jsx`/`App.jsx`** broke production twice from bad merges: unclosed JSX/if-blocks the first time, and later a duplicate `PLAYABLE_ROUTES` declaration plus missing `/mission/4/play` and `/mission/5/play` routes and a stale `MISSION_ICONS` mapping. Both times the cause was branches merged without reconciling overlapping mission-renumbering changes.
- Most recently, five quantum-concept inaccuracies were corrected across missions and the glossary. Superposition and Grover's speedups were being described as "parallel computation" or "testing everything at once" instead of interference-driven amplitude amplification; the "spinning coin" superposition metaphor (which actually implies a hidden definite state) got replaced with a coin balanced on its edge; Mission 1's copy wrongly called its search mechanic "quantum simulation"; and Mission 5's intro briefly contradicted its own debrief about what QKD actually guarantees. A follow-up pass made sure every mini-lesson interactive on the Resources page defines the concepts it introduces.

#### Resources page and mini-lesson interactives
The `/resources` page groups DB-backed lessons by category and links to `/resources/:id` detail pages, each optionally embedding a "Try it yourself" interactive. These were built one at a time, several through multiple redesigns: **BlochSphere** (mouse-driven qubit state), **GroversAlgorithm** (step-through Oracle/Diffusion with a visual scan and a two-phase averaging/reflecting reveal), **QuantumGates** (circuit builder with real rotation-matrix math), **Entanglement** (up to 6 hoverable qubits, plus a toggle contrasting independent vs. GHZ-correlated joint distributions), **WaveSuperposition** (rebuilt several times: a 3D vector, then fixed points on a wave, then a 3D interference-dot field, then finally a single mouse-driven Bloch sphere with two outcome spheres, after feedback that the interference-field version asked too much of first-time visitors), **Interference** (qubits become wavefunctions, combine into one wave, and produce a sampled probability distribution with a weighted "Measure!"), and **ShorsAlgorithm** (multiplication vs. classical-trial-division-vs-instant-Shor's factorization, showing why factoring's classical hardness underpins RSA).

#### AI Sandbox
The Sandbox page's three static descriptive tiles (Encryption/Search/Optimization) became a real interactive feature: a `POST /api/ai` endpoint proxies to a chat-completions API behind a strict system prompt (simulation-only, theoretical-only answers for anything hacking/encryption-attack-adjacent), returning a plain-text answer plus up to 3 related lessons chosen only from a manifest of real lesson ids already in the DB. The backend provider changed twice (Groq, then OpenAI, then Google Gemini); each swap was mechanical since all three expose the same request shape. The endpoint requires auth, rate-limits at 5 requests/minute/user, and validates prompt length.

#### Notable bug fixes worth remembering
- **Merge conflicts repeatedly broke production builds** in `Mission.jsx`/`App.jsx`, each traced to branches merged without reconciling overlapping changes.
- **Trailing-slash redirects broke the Vite dev proxy in the browser.** `@router.get("/")` on several routers issued a 307 to an absolute backend URL, which `fetch` followed directly and hit CORS. Fixed by switching to `@router.get("")` across the API.
- **React 18 StrictMode's dev-only double-invoke** permanently flipped a mounted-ref guard to `false` in the Government Files mission, sticking the UI at "Transmitting…". Fixed by resetting the ref inside the effect body itself.
- **Maze Mission crashed on every render** because of leftover code referencing undeclared variables/phase names from an earlier refactor. A follow-up static-analysis script was written to sweep the whole frontend for the same pattern.
- A large amount of accidentally-committed cruft (`server/.venv/`, `__pycache__`) was found and removed from git tracking.

#### Deployment
Deployment moved from a two-service plan (a separate Render static site and backend, wired together via `VITE_API_BASE_URL`/`CORS_ORIGINS`) to a single Docker-based Render service. FastAPI (`server/app/main.py`) now serves the built React app directly: `/assets` via `StaticFiles`, and an SPA fallback to `index.html` for any other non-API path. A multi-stage `Dockerfile` (Node build stage, then Python runtime stage) builds and serves both from one image and one URL, so CORS is no longer a production concern.

### How The App Works Now

#### Architecture
Quantum Lab is a single-page React app (Vite, React Router, Tailwind CSS, Framer Motion for animation) backed by a FastAPI/Python API, with Postgres (hosted on Supabase) as the database. In production, both are built into one Docker image and served by a single FastAPI process: FastAPI mounts `/api/*` routes first, serves hashed static assets under `/assets`, and falls back to `index.html` for any other path so React Router can take over client-side. Locally, Vite (`:5173`) proxies `/api` to `uvicorn` (`:8000`) during development.

#### Language split: where Python is used vs. where JavaScript is used
There's no Node backend and no server-rendered JS. The split is simple:

- **Python runs everything server-side**, under `server/`: all API routes (`server/app/api/*.py` — auth, missions, lessons, sandbox, resources, ai), the database layer (`server/app/db/models.py`'s SQLAlchemy ORM models and `session.py`'s engine/session factory), request/response validation (Pydantic schemas), password hashing (`passlib`/`bcrypt`), JWT issuing/verification (`python-jose`), and the outbound HTTP call to the AI provider for the Sandbox feature (`httpx`). FastAPI gives async request handling and automatic OpenAPI docs, and Pydantic gives a type-checked contract for every request/response body; SQLAlchemy handles the Postgres side. `server/scripts/add_lesson.py`, the CLI used to author/update lesson content, is also Python, reusing the same SQLAlchemy models rather than a separate JS/Node tool.
- **JavaScript, as JSX, runs everything client-side**, under `frontend/`: every page and component, all 5 missions' gameplay/animation logic, the Resources page's interactive lesson visualizations, the shared glossary tooltip, and the `fetch` calls into the Python API. React fits well here because the app is really a large set of distinct, animated screens (mission phases, lesson interactives) that map naturally onto components. Framer Motion handles the animation-heavy sequences, Tailwind handles styling, and Vite runs the dev server and production build.
- **The two only meet in the build/deploy pipeline**, not in shared code. The root `Dockerfile` is a two-stage build: stage 1 is a `node:20-slim` image that runs `npm install`/`npm run build` to compile the JSX/CSS into static files (`frontend/dist`), and stage 2 is a `python:3.12-slim` image that installs `requirements.txt`, copies the server code, and copies in stage 1's already-built `dist` folder. Nothing else. The deployed container has no Node or npm installed at all; the only JavaScript that ever runs is the pre-built bundle executing in the browser, served as static files by FastAPI. Locally, outside Docker, the two run as separate dev processes (`uvicorn` for the API, Vite's dev server for the frontend) that talk to each other over HTTP through Vite's `/api` proxy, not through shared imports.

#### Auth
JWT-based auth (`server/app/api/auth.py`, bcrypt-hashed passwords) with register/login/logout, `GET /me`, `PATCH /account`, `DELETE /account`. Token lifetime follows a per-user `remember_me` setting (1 day/week/month, editable in Settings). Changing username/password/email or deleting the account requires re-entering the current password. On the frontend, `AuthContext.jsx` holds session state, an `authFetch` wrapper clears the session and redirects to `/login` on any 401, and a client-side JWT-expiry poll logs out an idle session even if it never makes another API call.

#### The mission system
All 5 missions are rows in a `missions` table (list/detail served via `GET /api/missions` and `GET /api/missions/{id}`), fetched by `MissionGrid.jsx`/`Mission.jsx` at runtime. There's no hardcoded mission array left in the frontend. Each mission's actual gameplay lives in its own page component (`PasswordMission.jsx`, `MazeMission.jsx`, `MoleculeMission.jsx`, `SupplyChainMission.jsx`, `GovernmentFilesMission.jsx`), reached via `/mission/{id}/play`:

- **Mission 1 — Password Vault:** A breach scenario followed by a multi-account damage-control triage (defending accounts, assembling a password-manager vault, surviving 2FA/biometric minigames). Teaches Grover's algorithm as a quadratic, not exponential, speedup for brute-forcing password entropy.
- **Mission 2 — Maze Search:** The player first solves a maze solo, walking one corridor at a time and backtracking out of dead ends (classical search), then replays the same maze "quantum style," where each junction splits their token into one branch per available path, all coexisting, until one branch reaches the exit and that's the measurement, collapsing every other branch away. Teaches superposition and measurement collapse, contrasted against the classical run's step/coverage stats.
- **Mission 3 — Lost Medical Breakthrough ("Build the Molecule"):** The player manually catches atoms and tests candidate molecule formulas out of a 6.25-million-combination search space, then hands off to a quantum search phase running the same oracle-and-diffusion mechanic as the Grover's-algorithm lesson interactive. This is Grover-style unstructured search over candidate molecules, not molecular simulation.
- **Mission 4 — The Supply Chain Crisis ("Reroute the Network"):** A 60-second real-time "Warehouse Chaos" scheduling minigame (dragging orders onto docks against deadlines, managing workers/robots, absorbing random disruptions), whose real before/after numbers feed a `SimulationPhase` that animates the real oracle-and-diffusion round count climbing toward a near-optimal schedule. Frames quantum optimization as a way to find a good schedule out of a huge combinatorial space.
- **Mission 5 — Government Files ("Quantum Key Distribution"):** A series of photon-transmission rounds where the player has to detect eavesdropping, because measuring a quantum bit in transit disturbs it and tampering always leaves evidence. Rounds range from a clean baseline transmission, to spotting a snuck-in change, to scanning and clicking a moving disturbed photon, to a 5-message memory-verification round, to a 100-photon full-scale integrity check. Teaches QKD's core guarantee: eavesdropping is detectable, not preventable by secrecy.

#### Resources / mini-lessons system
Lessons live in a `lessons` table (`id` slug, `title`, `category`, `summary`, `video_id`, `duration`, `links` JSONB, optional `interactive` key), served via `GET /api/lessons` / `GET /api/lessons/{id}` and authored/updated with `server/scripts/add_lesson.py`, which upserts by id, so no rebuild or restart is needed to add a lesson. `/resources` lists lessons grouped by category; `/resources/:id` embeds the YouTube video, further-reading links, and, if the lesson has an `interactive` key, a "Try it yourself" component resolved through `frontend/src/components/interactives/index.js`. Current interactives: **BlochSphere**, **GroversAlgorithm**, **QuantumGates**, **Entanglement**, **WaveSuperposition**, **Interference**, and **ShorsAlgorithm**.

#### Glossary / QuantumDefinition
`frontend/src/data/glossary.js` holds short definitions for recurring terms (qubit, superposition, entanglement, RSA, Shor's algorithm, etc.), surfaced app-wide through a shared `QuantumDefinition` tooltip component. Mission debriefs and lesson interactives link a term's first load-bearing mention to its glossary entry rather than every occurrence. Every registered lesson interactive now defines the specialized concepts it introduces this way.

#### AI Sandbox
At `/sandbox`, logged-in users can click one of three starter-prompt tiles (Encryption/Search/Optimization) or type a free-text question. Requests go through `POST /api/ai`, which calls a chat-completions API behind a system prompt that keeps answers simulation/theory-only, refusing actionable hacking/exploit steps, and restricts "related lesson" suggestions to ids that actually exist in the `lessons` table. Responses render as a plain-text answer plus up to 3 linked `LessonCard`s. Logged-out visitors see the tiles as inert with a prompt to sign in instead of the input box.

#### Other current-state notes
- The browser tab favicon is an SVG rendition of the app's `QuantumCore` glowing-nucleus symbol, matching the blue/violet gradient used across the homepage hero, auth pages, and loading spinner.
- Key libraries: **React Router** for client-side routing, **Framer Motion** for the animation-heavy mission sequences and lesson interactives, **Tailwind CSS** for styling, **lucide-react** for icons.
- Deployment is a single Docker image/Render service serving both the API and the built frontend from one FastAPI process, with no separate frontend/backend URLs or CORS handling needed in production.
