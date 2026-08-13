# Frontend & Integration Updates

## 2026-07-29 — missions moved from a static frontend file into the database

Closes a gap flagged in `docs/RESOURCES_PAGE.md` (2026-07-08): `db/schema.sql` already had
`missions`/`mission_steps` tables when lessons were migrated off static JSON — lessons' DB migration
was explicitly modeled on missions' pre-existing schema — but missions itself was never actually
migrated. `server/app/api/missions.py` was a dead stub (hardcoded 4-mission Python list, never
touching the DB) despite a full unused `Mission` SQLAlchemy model already existing.

| Area                                        | What changed                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `db/schema.sql`                             | `missions.estimated_time` changed `INTEGER` → `VARCHAR` (display labels like "~1 min", not raw minutes); added `status` and `terminal_lines` (JSONB) columns |
| `db/seed_missions.sql`                      | New — idempotent seed for the 5 current missions, safe to re-run                       |
| `server/app/db/models.py`                   | `Mission` ORM updated to match the new columns                                         |
| `server/app/api/missions.py`                | Replaced the hardcoded stub with real DB queries, mirroring `lessons.py`'s already-working pattern |
| `frontend/src/data/missionsApi.js`          | New — `fetchMissions()`/`fetchMissionById()`, mirrors `lessonsApi.js`                   |
| `frontend/src/data/missions.js`             | Stripped to just `STATUS_LABELS`; the hardcoded `MISSIONS` array is gone                |
| `frontend/src/components/MissionGrid.jsx` / `frontend/src/pages/Mission.jsx` | Both now fetch on mount with the same loading/error pattern `Resources.jsx` already uses for lessons |

The `MissionResponse` Pydantic model aliases the DB's snake_case columns to the frontend's existing
camelCase contract (`description`→`summary`, `estimated_time`→`estimatedTime`, etc.), with an explicit
`field_validator` to stringify the integer `mission_id` PK — verified in isolation that Pydantic's
default lax mode does *not* auto-coerce int→str for a `str`-typed field before relying on it. Verified
the response shape against a real ORM instance, confirmed the FastAPI app imports cleanly, and
confirmed `npm run build` passes. The `ALTER TABLE`/seed SQL was handed to the user to run themselves
against the live Supabase database via the SQL Editor (per `db/schema.sql`'s own convention) rather
than executed automatically against production.

---

## Summary of Changes

### Backend

| Area                      | What changed                                                                  |
| ------------------------- | ----------------------------------------------------------------------------- |
| `app/api/auth.py`         | Added `GET /me`, `PATCH /account`, `DELETE /account` endpoints                |
| `app/api/auth.py`         | Added optional `username` field to registration                               |
| `app/api/auth.py`         | Added `_get_current_user` JWT dependency used by protected routes             |
| `app/api/auth.py`         | `PATCH /account` now accepts `email` field                                    |
| `app/api/auth.py`         | Username changes limited to once per 30 days — enforced server-side           |
| `app/api/auth.py`         | `GET /me` returns `username_changed_at` so frontend can show countdown        |
| `app/db/models.py`        | Added `username_changed_at` column to `User` model                            |
| `app/main.py`             | CORS configured to allow `http://localhost:5173`                              |
| `requirements.txt`        | Pinned `bcrypt==3.2.2` for passlib compatibility                              |
| `server/.env`             | `DATABASE_URL` points to Supabase session pooler (IPv4)                       |

### Frontend

| Area                          | What changed                                                        |
| ----------------------------- | ------------------------------------------------------------------- |
| `src/pages/Login.jsx`         | New login page — submits to `/api/auth/login`, saves session        |
| `src/pages/Register.jsx`      | New register page — auto-logs in after success, no second step      |
| `src/pages/Settings.jsx`      | New settings page — change username, password, email, delete account |
| `src/components/Nav.jsx`      | Added **Settings** button between greeting and Log out              |
| `src/context/AuthContext.jsx` | Auth state shared across all pages via React Context                |
| `src/pages/Home.jsx`          | Sign in / Create account buttons hidden once logged in              |
| `src/App.jsx`                 | Added `/settings` route                                             |
| `vite.config.js`              | Proxy `/api` → `http://localhost:8000` (eliminates CORS issues)     |

### Database

| Area            | What changed                                                        |
| --------------- | ------------------------------------------------------------------- |
| `db/schema.sql` | SQL file for creating all tables in Supabase                        |
| `db/schema.sql` | Added `username_changed_at TIMESTAMPTZ` column to `users` table     |
| Supabase        | All 5 tables created; `username_changed_at` column added via migration |

---

## How to Run

You need two terminals open — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
cd server
source .venv/bin/activate
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
API docs (Swagger UI): `http://localhost:8000/docs`

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## How to Test in the Browser

### 1. Register a new account

1. Go to `http://localhost:5173`
2. Click **Create account** (or visit `/register` directly)
3. Fill in first name, last name, email, and password (min 8 characters)
4. Username is optional — leave blank to auto-generate as `firstname.lastname`
5. Click **Create account**
6. You are automatically logged in and redirected to the home page
7. The top-right corner shows **Hi, [username]**

---

### 2. Log in to an existing account

1. Go to `http://localhost:5173/login`
2. Enter your email and password
3. Click **Sign in**
4. You are redirected to the home page
5. The top-right corner shows **Hi, [username]**
6. The Sign in / Create account buttons on the home page disappear

---

### 3. Stay logged in

- The session is stored in `localStorage` — closing the tab and coming back keeps you logged in
- The token expires after **24 hours**, after which you will need to log in again

---

### 4. Log out

- Click **Log out** in the top-right nav bar
- You are redirected to the home page
- The Sign in / Create account buttons reappear

---

### 5. Test the API directly (optional)

Use the Swagger UI at `http://localhost:8000/docs` to test any endpoint interactively.

Or with curl — replace `<token>` with the JWT returned from login:

```bash
# Get current user
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Update username
curl -X PATCH http://localhost:8000/api/auth/account \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "new_username"}'

# Delete account
curl -X DELETE http://localhost:8000/api/auth/account \
  -H "Authorization: Bearer <token>"
```

---

## Common Errors

| Error                                 | Cause                    | Fix                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| `500` on register/login               | DB not connected         | Check `DATABASE_URL` in `server/.env` uses session pooler URL |
| `401 Invalid or expired token`        | Token expired or missing | Log in again                                                  |
| `409 That username is already taken`  | Username collision       | Choose a different username                                   |
| `422` validation error                | Missing or invalid field | Check all required fields are filled                          |
| Frontend shows blank / no styles      | Vite not running         | Run `npm run dev` in `frontend/`                              |
| API calls return HTML instead of JSON | Vite proxy not active    | Restart Vite after any `vite.config.js` change                |
