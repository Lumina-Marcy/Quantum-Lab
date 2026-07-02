# App.jsx / Mission.jsx Fixes

## Summary of Changes

| Area                              | What changed                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/App.jsx`                      | Removed a duplicated/unclosed JSX block left over from a merge — build was failing with `Unterminated regular expression` |
| `src/App.jsx`                      | Restored the `/mission/1/play` → `PasswordMission` route inside the surviving `AuthProvider`/`Nav` tree |
| `src/pages/Register.jsx`           | Password input now has `minLength={8}` to match the backend's minimum length validator            |
| `src/pages/Register.jsx`           | Error handling now parses FastAPI's `422` array-shaped `detail` (was rendering `[object Object]`) |
| `src/pages/Mission.jsx`            | `UserDataForm` no longer calls `POST /api/auth/register` — it now requires the user to already be logged in |
| `src/pages/Mission.jsx`            | If no user is logged in, the form is replaced with a "please log in" prompt linking to `/login`   |
| `src/pages/Mission.jsx`            | On submit, mission profile data (username/email/password length) is stored locally for the simulation — no network call, no account is created |
| `src/pages/Mission.jsx`            | Removed now-dead `loading`/`error` state that only existed for the old network call                |

---

## Why

1. **Build failure** — `App.jsx` had two overlapping `return (...)` JSX blocks stacked on top of each other from a bad merge, which is invalid JSX and broke `vite build`/`vite dev` entirely.
2. **Registration 422** — the backend (`server/app/api/auth.py`) rejects passwords under 8 characters, but the frontend had no client-side check, so short test passwords silently failed with a 422 that rendered as an unreadable error.
3. **Mission "Lock In My Data" flow** — the Password Vault mission's data-entry step was calling the real `/api/auth/register` endpoint just to simulate "saving personal data," which could create real accounts / collide with real registrations. It now just requires the visitor to be logged in already (via `AuthContext`) and stores the sample data locally for the mission — no account is created from this form.

---

## How to Test

### 1. Confirm the app builds and runs

```bash
cd frontend
npm run build   # should complete with no esbuild/JSX errors
npm run dev
```

Open `http://localhost:5173` — the app should load without a blank page or console errors.

### 2. Register flow — password length validation

1. Go to `http://localhost:5173/register`
2. Try submitting a password shorter than 8 characters — the browser should block submission client-side (`minLength` validation) instead of round-tripping to the server
3. Submit with a valid password (8+ characters) — you should be registered and redirected to the home page

### 3. Register flow — readable error messages

1. Go to `/register`
2. Temporarily bypass the `minLength` (e.g. via devtools) or trigger another validation error (e.g. duplicate email) and submit
3. Confirm the error banner shows a readable message (not `[object Object]`)

### 4. Mission data form — logged out

1. Log out if currently logged in (Nav → **Log out**)
2. Go to `http://localhost:5173/mission/1`
3. The "Your Data" card should show a **"Please log in to continue this mission"** message with a link to `/login`, instead of the username/email/password form
4. **Start Mission** should remain disabled since no profile was set

### 5. Mission data form — logged in

1. Log in (or register) so you have an active session
2. Go to `/mission/1`
3. The username/email/password form should now be visible
4. Fill it in and click **Lock In My Data**
5. Confirm:
   - No network request is made to `/api/auth/register` (check the Network tab — there should be no POST to that endpoint from this form)
   - The masked profile card appears immediately (username, email, `•••` for password)
   - **Start Mission** becomes enabled and navigates to `/mission/1/play` with the profile data

### 6. Mission 1 play route

1. From `/mission/1`, click **Start Mission** after locking in data
2. Confirm you land on `/mission/1/play` and the `PasswordMission` page renders without error
