"""Add or update one lesson in the database from a JSON file.

Usage (from the repo root, with the server venv active):
    python server/scripts/add_lesson.py path/to/lesson.json

The JSON file is only used as an authoring format — nothing needs to be
committed to the repo afterward. The file's "id" determines whether this
inserts a new lesson or updates an existing one with the same id.

Expected JSON shape:
    {
      "id": "some-slug",
      "title": "...",
      "category": "...",
      "summary": "...",
      "videoId": "YOUTUBE_VIDEO_ID",
      "duration": "6:35",            (optional)
      "links": [{"label": "...", "url": "..."}],  (optional)
      "interactive": "bloch-sphere"  (optional, must match a key in
                                       frontend/src/components/interactives/index.js)
    }
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.models import Lesson
from app.db.session import SessionLocal


def upsert_lesson(data: dict) -> None:
    db = SessionLocal()
    try:
        lesson = db.query(Lesson).filter(Lesson.id == data["id"]).first()
        is_new = lesson is None
        if is_new:
            lesson = Lesson(id=data["id"])
            db.add(lesson)

        lesson.title = data["title"]
        lesson.category = data["category"]
        lesson.summary = data["summary"]
        lesson.video_id = data["videoId"]
        lesson.duration = data.get("duration") or None
        lesson.links = data.get("links", [])
        lesson.interactive = data.get("interactive")

        db.commit()
        print(f"{'Added' if is_new else 'Updated'} lesson '{lesson.id}'")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("file", help="Path to a lesson JSON file")
    args = parser.parse_args()

    data = json.loads(Path(args.file).read_text())
    upsert_lesson(data)


if __name__ == "__main__":
    main()
