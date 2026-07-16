# Auth Implementation — Change Summary

## Overview

Implemented user registration and login on the server side using FastAPI, SQLAlchemy, bcrypt password hashing, and JWT tokens.

---

## Update (2026-07-16): Session expiry, remember-me duration, password-confirmed settings

Three related gaps closed:

1. **Expired/invalid tokens now prompt a real re-login — proactively, not just reactively.** Previously a 401 from an expired token just surfaced as a raw error on whichever page triggered it. Two layers now catch this:
   - **Reactive:** a shared `authFetch` wrapper (`frontend/src/authFetch.js`) that any authenticated call goes through; on a 401 it clears `localStorage` and redirects to `/login`. `POST /login` and `POST /register` deliberately do **not** go through this wrapper — a wrong password on those is not a session-expiry event.
   - **Proactive:** `AuthContext.jsx` decodes the stored token's `exp` claim client-side (`frontend/src/jwt.js`) and checks it on mount and every 30 seconds while a user is logged in. This catches expiry even if the user is just browsing pages that never call the API (e.g. sitting on Landing or Missions) — without it, someone who never triggers an authenticated request would appear logged in indefinitely with a dead token.
   - Both paths funnel through the same `markSessionExpired()` helper (clears storage, sets a one-shot message) so the banner text and behavior are identical either way — `Login.jsx` shows "Your session expired — please log in again." via its existing error banner regardless of which path caught it.
2. **Remember-me duration is now a persistent per-user preference**, not a fixed 24 hours. A new `remember_me` column (`1_day` / `1_week` / `1_month`, default `1_day`) drives how long each freshly issued token lasts. Editable in Settings under "Stay signed in."
3. **Settings changes now require re-entering your current password.** Username, password, email changes, and account deletion all call a new `_require_current_password` check server-side before anything is mutated.

### `db/schema.sql` / `app/db/models.py`

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS remember_me VARCHAR NOT NULL DEFAULT '1_day';
ALTER TABLE users ADD CONSTRAINT users_remember_me_check CHECK (remember_me IN ('1_day', '1_week', '1_month'));
```
Already applied against the live Supabase DB; existing rows default to `'1_day'` (unchanged 24h behavior unless a user opts into a longer duration).

### `app/api/auth.py`

- `_create_token(user_id, email, remember_me)` now takes the remember-me value and looks up its duration in `_REMEMBER_ME_HOURS = {"1_day": 24, "1_week": 168, "1_month": 720}`, replacing the old fixed `_TOKEN_EXPIRE_HOURS = 24` constant. `login_user` passes the user's stored `remember_me`.
- New `_require_current_password(user, current_password)` helper: `422` if the field is missing, `403` if it doesn't match. **Deliberately never 401** — 401 is reserved exclusively for token/session problems so the frontend's `authFetch` can treat every 401 as "go log in again" with no per-endpoint exceptions.
- `PatchAccountRequest` gained `remember_me` (one of the three literal values) and `current_password` (optional — only required when username/password/email is also being changed; changing just the remember-me duration doesn't need it, since it's a low-risk preference change).
- `PATCH /account` calls `_require_current_password` up front (before mutating anything) whenever username/password/email is present, then — on any successful patch — mints and returns a **fresh token** reflecting the current `remember_me` value. This is what makes a remember-me change (or any settings change) take effect on the current browser tab immediately rather than only on the next login. The endpoint's response is now a plain dict (dropped `response_model=UserResponse`) since it needs to include the non-column `token` field, matching `login_user`'s existing style.
- `DELETE /account` now takes a body (`DeleteAccountRequest { current_password: str }`) and calls the same `_require_current_password` check before deleting.
- `UserResponse` gained `remember_me: str` so `GET /me` and the patch response both expose the current setting.

### Frontend

- `frontend/src/authFetch.js` (new) — exports `authFetch` (reactive 401 handling), `markSessionExpired` (shared clear-storage-and-flag-a-message helper), and `consumeSessionExpiredMessage`. See point 1 above.
- `frontend/src/jwt.js` (new) — `getTokenExpiryMs(token)` decodes a JWT's `exp` claim client-side without verifying the signature (verification happens server-side; this is purely a "should I bother the user" check) — returns `null` on any malformed input rather than throwing.
- `frontend/src/context/AuthContext.jsx` — `AuthProvider` now runs an expiry check on mount and every 30s via `setInterval` (cleared on unmount), calling `markSessionExpired()` + `setUser(null)` + `navigate('/login')` if the stored token has already expired. This is the proactive layer — it now needs to be rendered under `<BrowserRouter>` to use `useNavigate` (it already was, in `App.jsx`).
- `frontend/src/data/aiApi.js` — `askAi` now goes through `authFetch` instead of a manual `fetch` + conditional `Authorization` header.
- `frontend/src/pages/Settings.jsx` — each of the username/password/email sections gained its own "Current password" field (separate state per section, not shared — they're independent forms with independent Save buttons); a new "Stay signed in" section with a day/week/month `<select>`; the delete-account confirm step gained a current-password field too. All internal `fetch` calls swapped for `authFetch`.
- `frontend/src/pages/Login.jsx` — reads a one-shot session-expired message (via `consumeSessionExpiredMessage()` from `authFetch.js`) on mount and shows it in the existing error banner.

---

## Files Changed

### `requirements.txt`

Added three new dependencies:

| Package | Purpose |
|---|---|
| `passlib[bcrypt]` | Password salting and hashing |
| `python-jose[cryptography]` | JWT token generation and signing |
| `pydantic-settings` | Pydantic v2 settings/config support |
| `email-validator` | Email format validation via Pydantic's `EmailStr` |

---

### `app/core/config.py`

Fixed Pydantic v2 compatibility. `BaseSettings` was moved out of core `pydantic` into its own package in v2.

- **Before:** `from pydantic import BaseSettings` + `class Config`
- **After:** `from pydantic_settings import BaseSettings` + `model_config = {...}`

---

### `app/db/models.py`

Added `first_name` and `last_name` columns to the `User` table.

```python
first_name = Column(String, nullable=False)
last_name  = Column(String, nullable=False)
```

> **Database migration required.** Run the following against your PostgreSQL database:
> ```sql
> ALTER TABLE users
>   ADD COLUMN first_name VARCHAR NOT NULL,
>   ADD COLUMN last_name  VARCHAR NOT NULL;
> ```

---

### `app/api/auth.py`

Replaced placeholder stubs with a full implementation.

#### `POST /api/auth/register`

Accepts `first_name`, `last_name`, `email`, `password`, and an optional `username`. Returns the created user on success (`201`).

- Password is salted and hashed with bcrypt before storage — the plain-text password is never saved.
- If `username` is provided it is used directly; if it is already taken the request returns `409`.
- If `username` is omitted it is auto-generated as `firstname.lastname` (e.g. `john.doe`). Numeric suffixes handle collisions (`john.doe1`, `john.doe2`, …).

#### `POST /api/auth/login`

Accepts `email` and `password`. Returns user info plus a signed JWT token on success (`200`).

- Token is signed with `secret_key` from `.env` using HS256.
- Token expiry depends on the user's `remember_me` setting: **1 day** (default), **1 week**, or **1 month** — see the 2026-07-16 update above.

#### `POST /api/auth/logout`

Returns a confirmation message. Token invalidation is handled client-side (remove the token from storage).

---

#### `GET /api/auth/me`

Returns the currently authenticated user's profile. Requires a valid JWT in the `Authorization: Bearer <token>` header.

- Returns `401` if the token is missing, malformed, or expired.

#### `DELETE /api/auth/account`

Permanently deletes the authenticated user's account and all associated data (cascades via foreign keys). Requires `Authorization: Bearer <token>` and a body with `current_password`.

- Returns `403` if `current_password` doesn't match, `422` if it's missing.
- Returns `200` with a confirmation message on success.

#### `PATCH /api/auth/account`

Updates the authenticated user's `username`, `password`, `email`, and/or `remember_me`. Requires `Authorization: Bearer <token>`.

- At least one field must be provided; sending none returns `422`.
- If `username`, `password`, or `email` is present, `current_password` is also required and must match — `403` if wrong, `422` if missing. (`remember_me` alone does not require it.)
- `username` must be non-empty, not already taken by another user (`409`), and can only be changed once every 30 days (`429`).
- `password` must be at least 8 characters.
- `remember_me` must be one of `"1_day"`, `"1_week"`, `"1_month"`.
- Returns the updated user profile **plus a freshly signed token** on success (so a remember-me change applies to the current session immediately, not just the next login).

---

## Error Reference

| Scenario | Status | Message |
|---|---|---|
| Missing or invalid field | `422` | Per-field validation detail (auto from Pydantic) |
| Password shorter than 8 characters | `422` | `"must be at least 8 characters"` |
| Email already registered | `409` | `"An account with that email already exists"` |
| Wrong email or password on login | `401` | `"Invalid email or password"` |
| Missing `current_password` on a settings change | `422` | `"Current password is required to make this change."` |
| Wrong `current_password` on a settings change | `403` | `"Current password is incorrect."` |
| Expired or invalid token on any authenticated route | `401` | `"Invalid or expired token"` (frontend's `authFetch` redirects to `/login` on this) |
| Database / server failure | `500` | `"A server error occurred. Please try again later."` |

---

## Environment Variables Required (`.env`)

```env
DATABASE_URL=postgresql+psycopg://user:password@host/dbname
SECRET_KEY=your-secret-key-here
```

---

## Local Setup

Run these commands from the `server/` directory.

### 1. Install the venv module

```bash
sudo apt install python3.12-venv
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Make sure a `.env` file exists in `server/` with valid values (see [Environment Variables Required](#environment-variables-required-env) above).

### 5. Apply the database migration

```sql
ALTER TABLE users
  ADD COLUMN first_name VARCHAR NOT NULL,
  ADD COLUMN last_name  VARCHAR NOT NULL;
```

### 6. Start the server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

---

## Testing the Endpoints

### Prerequisites

1. Make sure your `.env` file is in the `server/` directory with valid values.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Apply the DB migration (see `models.py` section above).
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

---

### Interactive Docs (Recommended for Quick Testing)

FastAPI ships a built-in interactive UI. Open either of these in your browser once the server is running:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

You can send requests directly from the browser — no extra tools needed.

---

### Using `curl`

#### Register a new user

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "password": "securepass123"
  }'
```

Expected response (`201`):
```json
{
  "user_id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "username": "jane.doe",
  "email": "jane.doe@example.com"
}
```

---

#### Log in

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.doe@example.com",
    "password": "securepass123"
  }'
```

Expected response (`200`):
```json
{
  "user_id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "username": "jane.doe",
  "email": "jane.doe@example.com",
  "remember_me": "1_day",
  "token": "<jwt-token>"
}
```

Save the `token` value — you will need it for any protected routes.

---

#### Log out

```bash
curl -X POST http://localhost:8000/api/auth/logout
```

Expected response (`200`):
```json
{ "message": "Logged out successfully" }
```

---

#### Get current user (`/me`)

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <jwt-token>"
```

Expected response (`200`):
```json
{
  "user_id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "username": "jane.doe",
  "email": "jane.doe@example.com",
  "remember_me": "1_day"
}
```

---

#### Update username, password, and/or email (requires current password)

```bash
curl -X PATCH http://localhost:8000/api/auth/account \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane.quantum",
    "password": "newpassword99",
    "current_password": "securepass123"
  }'
```

All of `username`/`password`/`email` are optional — send only the ones you want to change — but `current_password` is required whenever any of them is present. Expected response (`200`): the updated user object plus a freshly signed `token`.

#### Update remember-me duration (no password needed)

```bash
curl -X PATCH http://localhost:8000/api/auth/account \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{ "remember_me": "1_month" }'
```

Applies to the returned `token` immediately — no need to log out and back in.

---

#### Delete account (requires current password)

```bash
curl -X DELETE http://localhost:8000/api/auth/account \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{ "current_password": "securepass123" }'
```

Expected response (`200`):
```json
{ "message": "Account deleted successfully" }
```

---

### Error Scenarios to Verify

#### Missing field (expect `422`)

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane.doe@example.com", "password": "securepass123" }'
```

#### Password too short (expect `422`)

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "new@example.com",
    "password": "short"
  }'
```

#### Duplicate email (expect `409`)

Register the same email twice and the second attempt returns:
```json
{ "detail": "An account with that email already exists" }
```

#### Wrong password on login (expect `401`)

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.doe@example.com",
    "password": "wrongpassword"
  }'
```

Expected response:
```json
{ "detail": "Invalid email or password" }
```

#### Wrong current password on a settings change (expect `403`)

```bash
curl -X PATCH http://localhost:8000/api/auth/account \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{ "email": "new-email@example.com", "current_password": "wrongpassword" }'
```

Expected response:
```json
{ "detail": "Current password is incorrect." }
```

#### Missing current password on a settings change (expect `422`)

```bash
curl -X PATCH http://localhost:8000/api/auth/account \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{ "email": "new-email@example.com" }'
```

Expected response:
```json
{ "detail": "Current password is required to make this change." }
```
