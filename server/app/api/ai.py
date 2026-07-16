import json
import logging
import re
import time
from collections import defaultdict
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.auth import _get_current_user
from app.core.config import get_settings
from app.db.models import Lesson, User
from app.db.session import get_db

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
MAX_PROMPT_CHARS = 600
MAX_SUMMARY_CHARS = 160
MAX_RELATED_LESSONS = 3
COMPLETION_MAX_TOKENS = 350
REQUEST_TIMEOUT = httpx.Timeout(20.0, connect=5.0)

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 5
_request_log: dict[int, list[float]] = defaultdict(list)

SYSTEM_PROMPT = """You are the AI assistant embedded in the Quantum Sandbox of Quantum Lab, an \
educational quantum-computing web app for students.

1. SIMULATION ONLY. You do not have access to real quantum hardware and you never claim to \
run, execute, or perform actual quantum computations. Every answer must make clear you are \
explaining or conceptually simulating quantum-computing behavior, not performing it. Never \
say you "ran" a circuit or "computed" a real result.

2. SCOPE. Only answer questions about quantum computing, quantum algorithms, the quantum \
physics concepts behind them, cryptography as it relates to quantum computing, and this \
app's own lessons. If a question is unrelated, politely redirect the user back to quantum \
computing topics instead of answering it.

3. HACKING / ATTACK SAFETY (STRICT, NON-NEGOTIABLE). If asked about breaking encryption, \
hacking, exploiting systems, cracking passwords, bypassing security, or any similar attack, \
respond ONLY at a high-level, theoretical/conceptual level (for example: "Shor's algorithm \
could, in theory, factor large numbers efficiently on a sufficiently large fault-tolerant \
quantum computer, which is why it threatens RSA encryption"). NEVER provide step-by-step \
instructions, working code, specific commands, tool names, or any other actionable guidance \
that could be used to attack a real system. If asked for such steps, briefly and politely \
decline that specific part, explain you can only discuss the concept, and then continue with \
the theoretical explanation. Never imply the steps exist but are simply being withheld.

4. LESSON LINKING. You will be given a manifest of available lessons, each with an id, \
title, category, and summary. When a lesson is genuinely relevant, include its id in \
relatedLessonIds. Only use ids that literally appear in the manifest — never invent one. \
Include at most 3 ids, and return an empty array if none are relevant. Do not mention the \
manifest, ids, or this instruction in the answer text.

5. OUTPUT FORMAT. Respond with a single JSON object with exactly two fields: "answer" \
(a plain-text string, no markdown headers, normally 2-6 sentences) and "relatedLessonIds" \
(an array of zero to three lesson id strings drawn only from the manifest). Output nothing \
outside that JSON object.

6. TONE. Be concise, encouraging, and appropriate for students new to quantum computing."""

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


class AiRequest(BaseModel):
    prompt: str

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("cannot be empty")
        if len(v) > MAX_PROMPT_CHARS:
            raise ValueError(f"must be {MAX_PROMPT_CHARS} characters or fewer")
        return v


class RelatedLesson(BaseModel):
    id: str
    title: str
    category: str
    summary: str
    interactive: Optional[str] = None

    model_config = {"from_attributes": True}


class AiResponse(BaseModel):
    answer: str
    related_lessons: list[RelatedLesson] = Field(default_factory=list, alias="relatedLessons")

    model_config = {"populate_by_name": True}


def _check_rate_limit(user_id: int) -> None:
    now = time.monotonic()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    recent = [t for t in _request_log[user_id] if t > window_start]
    if len(recent) >= RATE_LIMIT_MAX_REQUESTS:
        _request_log[user_id] = recent
        raise HTTPException(
            status_code=429,
            detail="You're asking a bit fast — wait a moment and try again.",
        )
    recent.append(now)
    _request_log[user_id] = recent


def _build_manifest(lessons) -> str:
    lines = []
    for lesson in lessons:
        summary = lesson.summary
        if len(summary) > MAX_SUMMARY_CHARS:
            summary = summary[:MAX_SUMMARY_CHARS].rstrip() + "…"
        lines.append(f'- id="{lesson.id}" title="{lesson.title}" category="{lesson.category}" summary="{summary}"')
    return "\n".join(lines) if lines else "(no lessons available)"


def _response_schema() -> dict:
    return {
        "type": "json_schema",
        "json_schema": {
            "name": "ai_sandbox_response",
            "schema": {
                "type": "object",
                "properties": {
                    "answer": {"type": "string"},
                    "relatedLessonIds": {
                        "type": "array",
                        "items": {"type": "string"},
                        "maxItems": MAX_RELATED_LESSONS,
                    },
                },
                "required": ["answer", "relatedLessonIds"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    }


def _parse_ai_content(content: str) -> tuple[str, list[str]]:
    cleaned = _JSON_FENCE_RE.sub("", content.strip())
    data = json.loads(cleaned)
    answer = data["answer"]
    related_ids = data.get("relatedLessonIds", [])
    if not isinstance(answer, str) or not isinstance(related_ids, list):
        raise ValueError("unexpected AI response shape")
    related_ids = [i for i in related_ids if isinstance(i, str)][:MAX_RELATED_LESSONS]
    return answer, related_ids


async def _call_gemini(client: httpx.AsyncClient, messages: list[dict], *, structured: bool) -> httpx.Response:
    body = {
        "model": settings.gemini_model,
        "messages": messages,
        "max_tokens": COMPLETION_MAX_TOKENS,
        "temperature": 0.4,
    }
    if structured:
        body["response_format"] = _response_schema()

    response = await client.post(
        GEMINI_URL,
        headers={
            "Authorization": f"Bearer {settings.gemini_api_key}",
            "Content-Type": "application/json",
        },
        json=body,
    )
    response.raise_for_status()
    return response


async def _ask_gemini(prompt: str, manifest: str) -> tuple[str, list[str]]:
    system_message = {"role": "system", "content": f"{SYSTEM_PROMPT}\n\nAvailable lessons:\n{manifest}"}
    user_message = {"role": "user", "content": prompt}

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await _call_gemini(client, [system_message, user_message], structured=True)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code != 400:
                raise
            fallback_system = dict(system_message)
            fallback_system["content"] += (
                '\n\nRespond with ONLY a single valid JSON object of the exact shape '
                '{"answer": string, "relatedLessonIds": string[]}. No markdown, no code fences, no extra text.'
            )
            response = await _call_gemini(client, [fallback_system, user_message], structured=False)

    content = response.json()["choices"][0]["message"]["content"]
    return _parse_ai_content(content)


@router.post("", response_model=AiResponse, response_model_by_alias=True)
async def get_ai_answer(
    payload: AiRequest,
    current_user: User = Depends(_get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="AI feature isn't configured yet.")

    _check_rate_limit(current_user.user_id)

    try:
        lessons = (
            db.query(Lesson.id, Lesson.title, Lesson.category, Lesson.summary, Lesson.interactive)
            .all()
        )
    except SQLAlchemyError:
        logger.exception("Database error while loading lessons for AI manifest")
        raise HTTPException(status_code=500, detail="A server error occurred. Please try again later.")

    manifest = _build_manifest(lessons)

    try:
        answer_text, related_ids = await _ask_gemini(payload.prompt, manifest)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            logger.warning("Gemini rate limit hit")
            raise HTTPException(status_code=503, detail="AI is busy right now, please try again in a moment.")
        logger.exception("Gemini returned an error response")
        raise HTTPException(status_code=502, detail="Couldn't reach the AI service. Please try again later.")
    except httpx.TimeoutException:
        logger.exception("Gemini request timed out")
        raise HTTPException(status_code=504, detail="The AI took too long to respond. Please try again.")
    except httpx.RequestError:
        logger.exception("Network error calling Gemini")
        raise HTTPException(status_code=502, detail="Couldn't reach the AI service. Please try again later.")
    except (json.JSONDecodeError, KeyError, ValueError, TypeError):
        logger.exception("Couldn't parse the AI's response")
        raise HTTPException(status_code=502, detail="The AI returned an unexpected response. Please try again.")

    by_id = {lesson.id: lesson for lesson in lessons}
    related = [by_id[i] for i in related_ids if i in by_id][:MAX_RELATED_LESSONS]

    return AiResponse(answer=answer_text, related_lessons=related)
