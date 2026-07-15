# Deployment (Render)

## Summary of Changes

| Area                              | What changed                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `server/app/main.py`               | Now serves the built frontend (`frontend/dist`) directly — static assets under `/assets`, an SPA fallback to `index.html` for any other non-API path, and a JSON info response at `/` when no build exists (local API-only dev) |
| `Dockerfile`                        | New — multi-stage build: builds the frontend (Node), then copies the built `dist/` into a Python image alongside the backend |
| `.dockerignore`                    | New — excludes `node_modules`, `.venv`, `__pycache__`, `dist`, `.git` from the Docker build context |
| `render.yaml`                      | Rewritten — **one** Docker-based web service instead of two separate services                     |
| `frontend/src/apiBase.js`          | Kept — exports `API_BASE_URL`, read from `import.meta.env.VITE_API_BASE_URL`, empty string by default |
| `frontend/src/pages/Login.jsx`, `Register.jsx`, `Settings.jsx` | Kept — API calls prefixed with `API_BASE_URL`                                 |
| `server/app/core/config.py`        | Kept — `cors_origins` setting (comma-separated string) and `cors_origins_list` property             |
| `server/requirements.txt`          | Duplicate/conflicting version pins removed                                                          |

---

## Why — and why this changed from the original plan

The first pass at deployment prep (still described further down, since it's not wasted work) split the app into **two Render services**: a static site for the frontend and a separate web service for the backend, cross-wired via `VITE_API_BASE_URL` and `CORS_ORIGINS`.

That works, but it means two things to deploy, two URLs, and cross-origin requests in production. Once it came up that hitting the backend's root URL only returned JSON instead of the actual app, the simpler fix was to **serve both from one process**: FastAPI now serves the built React app directly, so there's a single URL, a single service, and — since the frontend and API are now same-origin in production — CORS and `VITE_API_BASE_URL` stop being production concerns entirely (they're still useful for local dev, see below).

### How `server/app/main.py` serves the frontend

```python
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        candidate = FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")

else:
    @app.get("/")
    def read_root():
        return {"name": app.title, "version": app.version, "status": "ok", "docs": "/docs"}
```

- `app.include_router(routers.api_router)` is registered **before** the catch-all route, so `/api/...` always matches its own handlers first — the catch-all never shadows the API.
- `/assets/*` (the hashed JS/CSS files Vite produces) are served via a dedicated `StaticFiles` mount for correct MIME types.
- Any other path that isn't a real file on disk (e.g. `/login`, `/resources/some-lesson`) falls back to `index.html`, letting React Router take over client-side — this is the standard SPA-on-a-server pattern.
- If `frontend/dist` doesn't exist (e.g. running the backend alone locally without building the frontend first), the root falls back to the small JSON info response instead of crashing.

### `Dockerfile`

A two-stage build, since the backend needs Python and the frontend build needs Node — no single base image has both, and Render's native (non-Docker) runtimes only provide one language toolchain per service:

```dockerfile
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app/server
COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY server/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

The final image lays out `/app/server/...` and `/app/frontend/dist/...` as siblings under `/app`, mirroring the repo's actual `server/`/`frontend/` layout — so `main.py`'s `Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"` resolves correctly without any path special-casing for the container.

> **Honest caveat:** there's no Docker available in the environment this was built in, so the Dockerfile itself could not be built or run (`docker build` was not executable here). What *was* verified directly: every command the Dockerfile runs (`npm install && npm run build`, `pip install -r requirements.txt`, `uvicorn app.main:app`) works correctly when run by hand in the matching directory layout, and the resulting `server`+`frontend/dist` structure was exactly what was tested against `main.py`'s static-serving logic (see Verification Log). The Dockerfile mirrors those exact steps and paths, but build it once locally (`docker build -t quantum-lab .` from the repo root) before relying on it for a real deploy.

### `render.yaml`

Now a single service:

```yaml
services:
  - type: web
    name: quantum-lab
    runtime: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: CORS_ORIGINS
        value: http://localhost:5173
```

`DATABASE_URL` and `SECRET_KEY` are marked `sync: false` — Render will prompt for these on first deploy since they're secrets, never committed. `CORS_ORIGINS` is left at its local-dev default since it isn't load-bearing for the combined deploy — it only matters if you point a locally-running Vite dev server at the deployed backend.

### What's still true from the original (two-service) plan

`frontend/src/apiBase.js` and the `API_BASE_URL`-prefixed fetch calls in `Login.jsx`/`Register.jsx`/`Settings.jsx`, plus the `cors_origins` config, are all still in place and still useful:

- Locally, `npm run dev` (Vite on :5173) proxying to `uvicorn` (:8000) is unaffected — `API_BASE_URL` defaults to `''`, `CORS_ORIGINS` defaults to `http://localhost:5173`, nothing changed about the day-to-day dev workflow.
- If this project ever needs to go back to two separately-hosted services (e.g. a CDN-fronted frontend), that wiring is already there and doesn't need to be rebuilt.

`server/requirements.txt`'s duplicate-version fix is unrelated to this switch and stays as-is.

---

## How to Test

### 1. Build the frontend, then run the backend serving it

```bash
cd frontend && npm install && npm run build && cd ..
cd server
source ../.venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app &
```

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:8000/
# expect: 200 text/html; charset=utf-8

curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:8000/login
# expect: 200 text/html; charset=utf-8 (SPA fallback — React Router owns this route)

ASSET=$(ls frontend/dist/assets | grep '\.js$' | head -1)
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "http://127.0.0.1:8000/assets/$ASSET"
# expect: 200 text/javascript; charset=utf-8

curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/auth/login -X POST -H "Content-Type: application/json" -d '{}'
# expect: 422 (proves this still reaches the real handler, not swallowed by the SPA fallback)

curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/docs
# expect: 200 (Swagger UI)
```

### 2. Confirm the JSON fallback when there's no build

```bash
mv frontend/dist frontend/dist.bak
# restart uvicorn, then:
curl -s http://127.0.0.1:8000/ | python3 -m json.tool
# expect: {"name": "Quantum Lab API", "version": "0.1.0", "status": "ok", "docs": "/docs"}
mv frontend/dist.bak frontend/dist
```

### 3. Docker build (do this before your first real deploy — not verified in this pass)

```bash
docker build -t quantum-lab .
docker run -p 8000:8000 -e DATABASE_URL=... -e SECRET_KEY=... quantum-lab
curl http://localhost:8000/
```

### 4. Local dev workflow, unaffected

```bash
# Terminal 1
cd server && uvicorn app.main:app --reload
# Terminal 2
cd frontend && npm run dev
```
Visit `http://localhost:5173` as before — nothing about this workflow should feel different.

### 5. On Render

1. Push `Dockerfile`, `.dockerignore`, and `render.yaml`, then create a new Blueprint from the repo.
2. Render prompts for `DATABASE_URL` and `SECRET_KEY`.
3. Once deployed, visit the single service URL — it should show the actual app, not JSON, and all routes (including a hard refresh on a client-side route) should work.

---

## Verification Log

Manually verified on 2026-07-10 (no Docker available in this environment — see caveat above):

- Built the frontend (`npm run build`) and started the backend against that build. Confirmed: `/` → `200 text/html` serving the real `index.html` (verified the actual markup, including the built `<script>`/`<link>` tags pointing at `/assets/...`); `/login` (a client-only route with no server handler) → `200 text/html`, falling back to the same `index.html` as intended; `/assets/<hashed-file>.js` → `200 text/javascript`; `/api/auth/login` (POST, empty body) → `422`, proving the API router still takes priority over the catch-all; `/docs` → `200`.
- Confirmed `app.include_router(routers.api_router)` registered before the catch-all route is what makes the API take priority — this was checked by hitting a real API endpoint after adding the catch-all, not just assumed from route-ordering theory.
- Confirmed `frontend/dist` is already covered by the existing `.gitignore` (`dist` pattern), so the local build output won't get committed.

**Not verified:** the `Dockerfile` itself — no `docker` binary available in this environment. The individual commands it runs were verified by hand (see above), and the file mirrors those commands and the directory layout that was tested, but run `docker build` for real before the first production deploy.

**Prior two-service verification** (still relevant background, from before the switch): `requirements.txt` dedup confirmed via `pip show`; CORS default and multi-origin parsing confirmed via a live preflight request and direct `Settings` parsing; `VITE_API_BASE_URL` baking confirmed by inspecting the built JS bundle both with and without the env var set.
