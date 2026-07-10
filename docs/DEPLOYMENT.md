# Deployment (Render)

## Summary of Changes

| Area                              | What changed                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `frontend/src/apiBase.js`          | New — exports `API_BASE_URL`, read from `import.meta.env.VITE_API_BASE_URL`, empty string by default |
| `frontend/src/pages/Login.jsx`     | API call now prefixed with `API_BASE_URL`                                                           |
| `frontend/src/pages/Register.jsx`  | API calls now prefixed with `API_BASE_URL` (including the auto-login-after-register call, which was previously hardcoded to `/api/auth/login`) |
| `frontend/src/pages/Settings.jsx`  | API calls now prefixed with `API_BASE_URL`                                                           |
| `server/app/core/config.py`        | Added `cors_origins` setting (comma-separated string) and a `cors_origins_list` property             |
| `server/app/main.py`               | `CORSMiddleware` now reads `allow_origins` from `settings.cors_origins_list` instead of a hardcoded `["http://localhost:5173"]` |
| `.env.example`                     | Documented the new `CORS_ORIGINS` variable                                                          |
| `server/requirements.txt`          | Duplicate/conflicting version pins removed (see below)                                              |
| `render.yaml`                      | New — Blueprint defining both the backend web service and frontend static site together             |

---

## Why

Getting this deployed on Render (or any host where the frontend and backend live on two different URLs) exposed problems with how the app was wired for local-only development:

1. **Every fetch call used a relative path** (`/api/auth/...`), which only worked locally because `vite.config.js` proxies `/api` to `http://localhost:8000` in dev. That proxy doesn't exist in a production static build, so relative calls would 404 once frontend and backend are on separate domains.
2. **CORS was hardcoded** to `http://localhost:5173` in `server/app/main.py`, so the deployed backend would reject every request from the deployed frontend's real URL.
3. **`server/requirements.txt` had duplicate, conflicting version pins** — `fastapi`, `uvicorn`, `psycopg`, `pydantic`, and `pydantic-settings` were each listed twice with different versions (a leftover from a merge). This wasn't just cosmetic: reinstalling from the file showed the venv had actually picked up the *older*, untested version of each (e.g. `fastapi==0.114.0`, `pydantic==2.8.0`) rather than the versions actually developed and tested against (`fastapi==0.115.6`, `pydantic==2.13.4`).

### `VITE_API_BASE_URL`

`frontend/src/apiBase.js`:

```js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
```

Every file that calls the API imports this and prefixes its API constant, e.g. (`Login.jsx`):

```js
import { API_BASE_URL } from '../apiBase';
const API = `${API_BASE_URL}/api/auth`;
```

- **Locally**, `VITE_API_BASE_URL` is unset → `API_BASE_URL` is `''` → calls stay relative (`/api/auth/login`) and keep working through the existing Vite dev proxy, unchanged.
- **In production**, `VITE_API_BASE_URL` is set at build time (e.g. `https://quantum-lab-backend.onrender.com`) → Vite bakes it in as a literal at build time → calls become absolute, reaching the backend directly with no reverse-proxy/rewrite-rule needed on the frontend's static site.

> This currently covers `Login.jsx`, `Register.jsx`, and `Settings.jsx` — the only files on `main` that make `fetch()` calls to the backend at the time of writing. A separate resource-page branch (mini lessons / interactives) adds its own API client (`lessonsApi.js`) — when that branch merges, it should follow this same `API_BASE_URL` pattern rather than hardcoded relative paths.

### CORS

`server/app/core/config.py` gained:

```python
cors_origins: str = "http://localhost:5173"

@property
def cors_origins_list(self) -> list[str]:
    return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
```

`server/app/main.py`'s `CORSMiddleware` now reads `allow_origins=settings.cors_origins_list`. Default behavior for local dev is unchanged (still allows `http://localhost:5173`); in production, set `CORS_ORIGINS` to the deployed frontend's URL (comma-separate multiple origins if needed, e.g. a preview URL plus the production URL).

### `render.yaml`

A single Blueprint file defining both services so they can be deployed together:

- **Backend** (`quantum-lab-backend`): Python web service, `rootDir: server`, `pip install -r requirements.txt`, starts with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. `DATABASE_URL` and `SECRET_KEY` are marked `sync: false` (Render will prompt for these — they're secrets, not committed anywhere).
- **Frontend** (`quantum-lab-frontend`): static site, `rootDir: frontend`, `npm install && npm run build`, publishes `dist`. Includes the SPA fallback rewrite (`/* → /index.html`) required for React Router routes to survive a page refresh.
- The two services' URLs are cross-wired automatically via Render's `fromService`: the backend's `CORS_ORIGINS` is set from the frontend service's host, and the frontend's `VITE_API_BASE_URL` is set from the backend service's host.

> **Caveat, called out in comments in the file itself:** Render's `fromService` `property: host`/`hostport` may return a bare hostname rather than a full `https://...` origin — this wasn't verified against real Render infrastructure (no way to test that from a local dev sandbox). After the first deploy, check that `CORS_ORIGINS` and `VITE_API_BASE_URL` actually resolved to full URLs; hardcode them in `render.yaml` if not.

---

## How to Test

### 1. Backend — requirements and config

```bash
cd server
source ../.venv/bin/activate   # or your venv's activate script
pip install -r requirements.txt
python -c "from app.main import app; print('backend imports OK')"
```

Confirm the installed versions match the file exactly (no duplicate/older versions silently winning):

```bash
pip show fastapi pydantic pydantic-settings psycopg | grep -E "Name|Version"
```

### 2. CORS — default and multi-origin

```bash
uvicorn app.main:app --reload &

# Default origin (should succeed)
curl -i -X OPTIONS http://127.0.0.1:8000/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"
# Expect: access-control-allow-origin: http://localhost:5173

# Multi-origin parsing
CORS_ORIGINS="https://foo.onrender.com, https://bar.onrender.com" python -c "
from app.core.config import Settings
print(Settings(_env_file='.env').cors_origins_list)
"
# Expect: ['https://foo.onrender.com', 'https://bar.onrender.com']
```

### 3. Frontend — `VITE_API_BASE_URL` baked in correctly

```bash
cd frontend

# Default (no env var) — API calls should stay relative
npm run build
grep -o "/api/auth" dist/assets/*.js   # should match

# With the env var — the real URL should appear as a literal in the bundle
VITE_API_BASE_URL="https://quantum-lab-backend.onrender.com" npm run build
grep -o "https://quantum-lab-backend.onrender.com" dist/assets/*.js   # should match

# Rebuild without the env var afterward to restore the normal dev-friendly build
npm run build
```

### 4. Full local run, end to end

1. Start the backend (`uvicorn app.main:app --reload`) and frontend (`npm run dev`) as usual — nothing about local dev workflow should have changed.
2. Log in / register / update account settings and confirm everything still works (still goes through the Vite proxy, `API_BASE_URL` is empty locally).

### 5. On Render

1. Push `render.yaml` and create a new Blueprint from the repo.
2. Render will prompt for `DATABASE_URL` and `SECRET_KEY` on the backend service (these are intentionally not synced/committed).
3. After the first deploy, open the frontend service's environment tab and confirm `VITE_API_BASE_URL` resolved to a full `https://...` URL (not just a bare hostname) — same check for the backend's `CORS_ORIGINS`. Fix manually in `render.yaml` if either didn't resolve as expected.
4. Load the deployed frontend URL, open the browser's network tab, and confirm API calls go to the deployed backend URL with no CORS errors.

---

## Verification Log

Manually verified on 2026-07-10, without access to real Render infrastructure (verified everything that's testable locally; flagged what isn't):

- `server/requirements.txt`: confirmed the *before* state had the venv running the older duplicate-block versions (`fastapi==0.114.0`, `pydantic==2.8.0`, etc.) via `pip show` — validating that the duplication was a real bug, not just cosmetic. After the fix, reinstalled and confirmed the newer versions (`fastapi==0.115.6`, `pydantic==2.13.4`, etc.) are what's actually installed, and `from app.main import app` still imports cleanly.
- CORS: started the backend and sent a real `OPTIONS` preflight request against `/api/auth/login` with `Origin: http://localhost:5173` — confirmed `access-control-allow-origin: http://localhost:5173` in the response, matching the new default. Confirmed comma-separated `CORS_ORIGINS` parses into a clean list with whitespace trimmed.
- `VITE_API_BASE_URL`: built the frontend twice — once with no env var (relative paths preserved) and once with `VITE_API_BASE_URL=https://quantum-lab-backend.onrender.com` set (confirmed that exact URL string appears as a literal in the built bundle, to be joined with each API path at runtime via the template literal). Rebuilt a final time without the env var to leave the repo in its normal local-dev-friendly state.
- Confirmed no other hardcoded `/api` string literals remained anywhere in `frontend/src` after the fetch-call updates — checked against the actual current file set on `main` (`Login.jsx`, `Register.jsx`, `Settings.jsx` are the only files that call the API right now).

**Not verified (no way to test without a real Render account/deploy):** whether `render.yaml`'s `fromService` `property: host`/`hostport` actually resolves to a full `https://...` origin for both `CORS_ORIGINS` and `VITE_API_BASE_URL`, or a bare hostname that would need reformatting. Check this manually after the first Blueprint deploy.

**Note on repo state:** this work was implemented twice in the same day — the first pass was lost when uncommitted changes got wiped during an unrelated `git` operation (see project history around 2026-07-08/10). This doc and the underlying code reflect the second, current pass, redone directly against the `main` branch. **Commit this work once reviewed** so it doesn't need a third pass.
