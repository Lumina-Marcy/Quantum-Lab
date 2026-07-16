# AI Sandbox (theory-only AI assistant)

## Summary of Changes

| Area                                  | What changed                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `server/app/api/ai.py`                | New — `POST /api/ai`, proxies a chat request to Gemini's OpenAI-compatible chat-completions endpoint with a strict safety system prompt, returns a plain-text answer plus up to 3 related lessons |
| `server/app/api/routers.py`           | Registered the `ai` router under `/api/ai`                                                          |
| `server/app/core/config.py`           | Added `gemini_api_key` (default `""`) and `gemini_model` (default `"gemini-3.1-flash-lite"`)        |
| `server/.env`                         | Added `GEMINI_API_KEY=` (blank placeholder) and `GEMINI_MODEL=gemini-3.1-flash-lite`                |
| `server/requirements.txt`             | Added `httpx==0.27.2` (needed to call Gemini's API; nothing else in the app used an HTTP client)     |
| `frontend/src/data/aiApi.js`          | New — `askAi(prompt)`, mirrors `lessonsApi.js`'s fetch conventions, attaches the user's auth token   |
| `frontend/src/pages/Sandbox.jsx`      | Rewritten — the 3 static tiles become clickable starter-prompt buttons (when logged in), plus a free-text "Ask the AI" panel with loading/error states and related-lesson cards |

---

## Why

The Sandbox page previously showed three purely descriptive tiles (Encryption/Search/Optimization) with no logic behind them. The goal was to make it genuinely interactive: let a user either click a starter tile or type their own question about quantum computing, and get back a real AI-generated explanation — while keeping two hard constraints:

- The AI must never claim to run real quantum hardware — it only explains/simulates conceptually.
- For anything hacking/encryption-attack-adjacent, it must give **theoretical answers only**, never actionable step-by-step exploit instructions.

A third goal — "the AI develops small interactive things to explain terms or link them to the resources page" — is implemented **without letting the AI generate or execute any new code**. Instead, the AI is given a manifest of the app's existing lessons (id, title, category, summary) and can only choose to reference lessons that already exist by their id. The backend looks those ids up in the database itself (never trusting the model's text directly) and returns the full lesson rows, including their `interactive` key if one exists — so the frontend can embed an actual already-built interactive (`BlochSphere`, `GroversAlgorithm`, `WaveSuperposition`, `QuantumGates`, `Entanglement`, `Interference`) exactly the same way `ResourceDetail.jsx` already does. There is no path for the model to reference an arbitrary/unsafe component.

### Why Gemini

This originally used Groq, then briefly OpenAI, and was swapped again to Google's Gemini API at the user's request, for its free tier: `gemini-3.1-flash-lite` is free of charge up to that tier's rate limits (roughly 15 requests/minute and 1,500 requests/day — Google's published numbers, not something this app enforces or tracks itself). Gemini exposes an OpenAI-compatible endpoint (`POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, Bearer auth, `{model, messages}` body), so the swap reused the exact same request/response shape as the OpenAI integration it replaced.

Because all these providers share the same OpenAI-compatible request/response shape, swapping was mechanical: base URL, default model name, and the `Settings` field names (`openai_api_key`/`openai_model` → `gemini_api_key`/`gemini_model`) — the rest of the endpoint's logic (auth, rate limiting, manifest building, structured-output request/fallback, error handling) is unchanged. One caveat: the app's own rate limiter (5 requests/minute **per user**) is a per-user cap, not a global one — with more than a couple of concurrent users it's possible to exceed Gemini's free-tier 15 RPM / 1,500 RPD caps for the whole API key, which this app has no visibility into or protection against. If that becomes a real risk, a shared/global limiter (or catching Gemini's `429` explicitly, which the code already maps to a friendly `503`) would need to be added.

### Endpoint design (`server/app/api/ai.py`)

- **`POST /api/ai`** (registered as `@router.post("")` to avoid the trailing-slash redirect bug this app already hit and fixed elsewhere in `lessons.py`/`missions.py`/`resources.py`).
- **Auth required** — reuses `_get_current_user` from `server/app/api/auth.py` (the same dependency `lessons.py` already imports cross-module), so an anonymous request gets rejected before ever reaching Gemini.
- **Per-user rate limit** — a simple in-memory sliding window (5 requests/minute/user, no new dependency). This is a single-process backstop, not a distributed limiter; a multi-instance deployment would need a shared store (e.g. Redis) instead. It also protects against burning through Gemini's free-tier quota faster than intended (though it's a per-user cap, not a global one — see the caveat above).
- **Request validation** — `prompt` must be non-empty and ≤600 characters (keeps token usage bounded).
- **Manifest** — every lesson's `id`/`title`/`category`/`summary` (summary truncated to ~160 characters) is loaded from the DB and included in the system message, so the model always has an up-to-date list of what it's allowed to reference — no hardcoded list to maintain.
- **Structured output** — the request asks Gemini's OpenAI-compatible endpoint for `response_format: {"type": "json_schema", ...}` so the model returns exactly `{"answer": string, "relatedLessonIds": string[]}`. If the configured model doesn't support that (a `400` response), the code automatically retries once with a plain-text instruction to emit raw JSON only, and parses the result leniently (stripping a possible code fence). This fallback is cheap insurance in case Gemini's structured-output support for this exact request shape is incomplete, or the configured model is ever changed.
- **Lesson id safety** — any `relatedLessonIds` the model returns are looked up against the lessons already fetched from the DB in this same request; ids that don't match anything are silently dropped (defends against a hallucinated id), and the result is capped to 3.
- **Error handling** mirrors `auth.py`'s existing style (`try/except HTTPException: raise` → specific exception types → `logger.exception(...)` → a friendly `HTTPException`), extended for the new failure modes: no API key configured (`503`), our own rate limit hit (`429`), Gemini rate-limited (`503`), Gemini other errors (`502`), timeout (`504`), unparseable AI response (`502`).

### The safety system prompt

The full prompt (hardcoded in `ai.py` as `SYSTEM_PROMPT`) has six numbered rules: simulation-only framing, topic scope, a strict non-negotiable rule to answer hacking/encryption-attack questions only in theoretical/conceptual terms and explicitly refuse to give steps/code/commands, lesson-linking instructions (only reference ids that literally appear in the manifest), the exact JSON output shape, and tone. This is the single place to edit if the safety framing ever needs to change.

### Frontend (`Sandbox.jsx`, `aiApi.js`)

- Each of the 3 existing tiles now carries a `starterPrompt` string. When logged in, a tile is a button that calls the ask flow with that starter prompt directly (not via `/api/sandbox` — that endpoint is unrelated, just static config). When logged out, the tiles stay as plain non-interactive divs, same as before.
- A new "Ask the AI" panel below the tiles: a disclaimer line, then either a "Sign in to ask the AI" prompt (logged out) or a `<textarea>` + Ask button (logged in).
- On success, the answer renders in a plain-text tile; any related lessons render via the existing `LessonCard` component (reused unmodified — it only reads `id`/`title`/`category`/`summary`), which links to the lesson's own page. (An earlier version also embedded the lesson's interactive inline here, same as `ResourceDetail.jsx` does; that was removed at the user's request — related lessons in the Sandbox are link-only now.)
- On failure, the backend's own `detail` message is shown directly (each failure mode already has a distinct, user-friendly message — no need for a generic "something went wrong").

No new npm dependencies were added on the frontend.

---

## How to Test

### 1. Configure a Gemini API key

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Add it to `server/.env`: `GEMINI_API_KEY=<your key>`.
3. Restart the backend.

Without a key, the endpoint still runs — it returns a clean `503` "AI feature isn't configured yet." instead of crashing on startup.

### 2. Backend checks

```bash
# No auth header -> 422 (FastAPI's own required-header validation; same as any other
# endpoint using _get_current_user, e.g. try GET /api/auth/me with no header too)
curl -X POST http://127.0.0.1:8000/api/ai -d '{"prompt":"test"}'

# Malformed/garbage token -> 401
curl -X POST http://127.0.0.1:8000/api/ai -H "Authorization: Bearer not-a-real-token" -d '{"prompt":"test"}'

# Valid token, empty prompt -> 422
curl -X POST http://127.0.0.1:8000/api/ai -H "Authorization: Bearer <token>" -d '{"prompt":"   "}'

# Valid token, prompt over 600 characters -> 422

# Valid token, no GEMINI_API_KEY set -> 503 "AI feature isn't configured yet."

# Valid token, 6 requests within a minute -> the 6th returns 429
```

### 3. Frontend, live browser

1. Go to `/sandbox` while logged out — confirm the 3 tiles are plain (non-clickable), and the AI panel shows "Sign in to ask the AI…" instead of a textarea.
2. Log in, go to `/sandbox` — confirm the 3 tiles are now buttons and a textarea + Ask button appear.
3. Click the **Encryption** tile — confirm it immediately submits its starter prompt (no need to type anything) and shows a loading state, then either an answer or (if no key configured) the "AI feature isn't configured yet." message.
4. Type a custom question in the textarea and click **Ask** — confirm the same flow.
5. With a real key configured, ask something that matches an existing lesson (e.g. "what is a qubit") — confirm a related-lesson card appears below the answer, linking to `/resources/what-is-a-qubit`, with its Bloch-sphere interactive embedded inline.
6. With a real key configured, ask something like "how do I actually crack RSA encryption step by step" — confirm the answer stays theoretical/conceptual and never includes actionable steps, commands, or code.
7. Check the browser console — no `pageerror` entries (network-log entries for intentional error responses, e.g. a deliberate 503 test, are expected and not a bug).

---

## Verification Log

Manually verified on 2026-07-15, initially built against Groq (no real key available in this environment — verified everything that doesn't require one, plus the network path to Groq itself):

- **401 vs 422 auth-gating**: confirmed a request with no `Authorization` header returns `422` (FastAPI's own required-header validation — confirmed this is pre-existing, identical behavior on `GET /api/auth/me`, not something new introduced here) and a request with a garbage/invalid bearer token returns `401` `"Invalid or expired token"`.
- **Validation**: an all-whitespace prompt and a 601-character prompt both correctly returned `422` with the expected `field_validator` messages.
- **Not-configured path**: with the API key unset (matching the real `server/.env` state), a valid authenticated request returned `503` `"AI feature isn't configured yet."`.
- **Rate limiter**: with a dummy (invalid) API key set, 6 rapid requests from the same authenticated test user returned `502` for the first 5 (the provider correctly rejected the dummy key with a real `401 Unauthorized` — confirming the request actually reaches the live endpoint, DNS/TLS/request-shape all work) and `429` `"You're asking a bit fast — wait a moment and try again."` on the 6th, confirming the 5-requests-per-minute-per-user limiter engages before the external call is even attempted.
- Confirmed all error paths are logged server-side via `logger.exception(...)` (checked the actual traceback lines in the server log), not silently swallowed.
- **Frontend, logged out**: `/sandbox` shows the 3 tiles as plain non-clickable divs and a "Sign in to ask the AI…" message instead of a textarea.
- **Frontend, logged in** (via a temporary test account, deleted after): the 3 tiles render as buttons; clicking **Encryption** submitted its starter prompt automatically and displayed "AI feature isn't configured yet." (correct, since no real key is configured in this environment); typing a custom prompt into the textarea and clicking **Ask** produced the same correct behavior. Screenshot confirmed the full panel layout (disclaimer, tiles, textarea, error message) renders as designed.
- Zero `pageerror` entries in either logged-in or logged-out passes; the only `console` entries were the browser's own network log of the two intentional 503 responses, not JS exceptions.
- `npm run build` completed with no errors; `python -c "from app.main import app"` confirmed the backend still imports cleanly with the new router registered (route count went from 18 to 19).

**Follow-up (2026-07-15):** swapped the backend provider from Groq to OpenAI at the user's request, for use via a free/student access path. Renamed `Settings.groq_api_key`/`groq_model` → `openai_api_key`/`openai_model` (default model `gpt-4o-mini`), updated `server/.env`, and renamed all Groq-specific identifiers/URLs/log messages in `ai.py` to OpenAI (`GROQ_URL` → `OPENAI_URL = "https://api.openai.com/v1/chat/completions"`, `_call_groq`/`_ask_groq` → `_call_openai`/`_ask_openai`). Re-ran the full verification pass against the real OpenAI endpoint (a fresh temporary test account, deleted after):

- Confirmed the backend still imports cleanly (`python -c "from app.main import app"`, 19 routes) and `npm run build` still passes (nothing on the frontend references the provider directly).
- With a dummy (invalid) `OPENAI_API_KEY`, a request genuinely reached `https://api.openai.com/v1/chat/completions` and got rejected with a real `401 Unauthorized` from OpenAI, correctly mapped to our `502` "Couldn't reach the AI service" — confirming the new endpoint/auth header shape is correct.
- Re-ran the 6-rapid-requests rate-limit check against the OpenAI-configured backend: first 5 returned `502` (dummy key), 6th returned `429`, identical behavior to the original Groq-based test.
- Caught and fixed one incident during the swap, not a bug in the final code: uvicorn's `--reload` watcher restarted the dev server in the narrow window between editing `config.py` (which removed the `groq_model` field) and editing `.env` (which still had `GROQ_MODEL=...` on disk at that instant), causing a one-off `pydantic.ValidationError: extra_forbidden` crash. Not a real issue once both files were saved — confirmed by restarting the server after finishing the edits, which came up clean.
- No console errors.

**Not yet verified** (requires a real API key, which isn't available in this environment): an actual successful AI answer, the structured-output/fallback JSON parsing path against a real model response, related-lesson matching accuracy, and the hacking-question safety behavior in practice. These should be checked manually once a real key is added, using the steps in "How to Test" above.

**Follow-up (2026-07-16):** swapped the backend provider from OpenAI to Google's Gemini API at the user's request, to use its free tier (`gemini-3.1-flash-lite`, free up to ~15 RPM / 1,500 RPD per Google's published limits). Renamed `Settings.openai_api_key`/`openai_model` → `gemini_api_key`/`gemini_model` (default model `gemini-3.1-flash-lite`), updated `server/.env` (`OPENAI_API_KEY`/`OPENAI_MODEL` → `GEMINI_API_KEY`/`GEMINI_MODEL`), and renamed all OpenAI-specific identifiers/URLs/log messages in `ai.py` to Gemini (`OPENAI_URL` → `GEMINI_URL`, now pointed at Gemini's OpenAI-compatible endpoint `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`; `_call_openai`/`_ask_openai` → `_call_gemini`/`_ask_gemini`). No other logic changed — same request/response shape, same rate limiter, same error mapping.

Confirmed `python -c "from app.main import app"` still imports cleanly with the renamed settings fields (19 routes, unchanged). Nothing on the frontend references the provider directly, so no frontend changes were needed.

**Not yet verified** (requires a real `GEMINI_API_KEY`, which isn't available in this environment): an actual round-trip request to Gemini's OpenAI-compatible endpoint, whether `response_format: json_schema` is honored as-is or falls through to the plain-text-JSON fallback path, and the per-user-vs-global rate-limit caveat noted above in practice. These should be checked manually once a real key is added, using the steps in "How to Test" above.
