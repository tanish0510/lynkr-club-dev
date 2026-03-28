"""
Waitlist storage in a JSON file on the backend server.
File: backend/data/waitlist.json (created automatically if missing).
Single-writer safe via a lock; suitable for one backend instance.
"""
import json
import logging
import os
import threading
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)

# Default path relative to backend root
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("WAITLIST_DATA_DIR", str(ROOT_DIR / "data")))
FILE_PATH = DATA_DIR / "waitlist.json"

_lock = threading.Lock()


def _ensure_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not FILE_PATH.exists():
        FILE_PATH.write_text("[]", encoding="utf-8")


def _load() -> List[dict]:
    _ensure_file()
    try:
        raw = FILE_PATH.read_text(encoding="utf-8").strip()
        if not raw:
            return []
        return json.loads(raw)
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("Waitlist file read failed, starting fresh: %s", e)
        return []


def _save(entries: List[dict]) -> None:
    _ensure_file()
    with open(FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def email_exists(normalized_email: str) -> bool:
    """Return True if this email is already in the waitlist."""
    with _lock:
        entries = _load()
    return any((e.get("email") or "").lower() == normalized_email.lower() for e in entries)


def append_entry(
    *,
    timestamp: str,
    name: str,
    email: str,
    age: str,
    gender: str,
    favorite_brands: List[str],
    city: str = "",
) -> None:
    """Append one waitlist entry. Caller must have checked duplicates."""
    entry = {
        "timestamp": timestamp,
        "name": name,
        "email": email,
        "age": age,
        "gender": gender,
        "favorite_brands": favorite_brands,
        "city": city or "",
    }
    with _lock:
        entries = _load()
        entries.append(entry)
        _save(entries)


def get_recent_entries(limit: int = 10) -> List[dict]:
    """Return most recent entries for live popup: name, city, favorite_brands, created_at."""
    with _lock:
        entries = _load()
    # Newest last
    recent = list(reversed(entries))[:limit]
    return [
        {
            "name": (e.get("name") or "").strip() or "Someone",
            "city": (e.get("city") or "").strip() or None,
            "favorite_brands": e.get("favorite_brands") or [],
            "created_at": e.get("timestamp") or "",
        }
        for e in recent
    ]
