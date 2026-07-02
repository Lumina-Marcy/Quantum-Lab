# Auth Implementation — Change Summary

## Overview

Implemented user registration and login on the server side using FastAPI, SQLAlchemy, bcrypt password hashing, and JWT tokens.

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
- Token expires after **24 hours**.

#### `POST /api/auth/logout`

Returns a confirmation message. Token invalidation is handled client-side (remove the token from storage).

---

#### `GET /api/auth/me`

Returns the currently authenticated user's profile. Requires a valid JWT in the `Authorization: Bearer <token>` header.

- Returns `401` if the token is missing, malformed, or expired.

#### `DELETE /api/auth/account`

Permanently deletes the authenticated user's account and all associated data (cascades via foreign keys). Requires `Authorization: Bearer <token>`.

- Returns `200` with a confirmation message on success.

#### `PATCH /api/auth/account`

Updates the authenticated user's `username`, `password`, or both. Requires `Authorization: Bearer <token>`.

- At least one field must be provided; sending neither returns `422`.
- `username` must be non-empty and not already taken by another user (`409`).
- `password` must be at least 8 characters.
- Returns the updated user profile on success.

---

## Error Reference

| Scenario | Status | Message |
|---|---|---|
| Missing or invalid field | `422` | Per-field validation detail (auto from Pydantic) |
| Password shorter than 8 characters | `422` | `"must be at least 8 characters"` |
| Email already registered | `409` | `"An account with that email already exists"` |
| Wrong email or password on login | `401` | `"Invalid email or password"` |
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
  "email": "jane.doe@example.com"
}
```

---

#### Update username and/or password

```bash
curl -X PATCH http://localhost:8000/api/auth/account \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane.quantum",
    "password": "newpassword99"
  }'
```

Both fields are optional — send only the ones you want to change. Expected response (`200`): the updated user object.

---

#### Delete account

```bash
curl -X DELETE http://localhost:8000/api/auth/account \
  -H "Authorization: Bearer <jwt-token>"
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
