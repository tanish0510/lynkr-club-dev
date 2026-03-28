"""Environment-backed settings and shared constants (formerly top of server.py)."""
from __future__ import annotations

import os
import re
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[2]
# Project root .env first, then backend/.env
load_dotenv(BACKEND_ROOT.parent / ".env")
load_dotenv(BACKEND_ROOT / ".env")

USERNAME_REGEX = re.compile(r"^[a-z0-9_]{3,20}$")
DEFAULT_AVATAR = "avatar_01.svg"
AVATAR_PATH_REGEX = re.compile(r"^avatar_(0[1-9]|1[0-9]|20)\.svg$")
USERNAME_CHANGE_COOLDOWN_HOURS = int(os.environ.get("USERNAME_CHANGE_COOLDOWN_HOURS", "24"))

DATABASE_URL = (os.environ.get("DATABASE_URL") or "").strip()
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is required, e.g. postgresql+asyncpg://lynkr:lynkr@127.0.0.1:5432/lynkr_db"
    )

JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

resend_api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "Lynkr <admin@lynkr.club>")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://lynkr.club")
VERIFICATION_OTP_EXPIRE_MINUTES = max(5, min(60, int(os.environ.get("VERIFICATION_OTP_EXPIRE_MINUTES", "10"))))

ZOHO_MAIL_ENABLED = (os.environ.get("ZOHO_MAIL_ENABLED", "0") or "0").strip().lower() in ("1", "true", "yes", "on")
ZOHO_MAIL_REQUIRED_ON_SIGNUP = (os.environ.get("ZOHO_MAIL_REQUIRED_ON_SIGNUP", "0") or "0").strip().lower() in (
    "1",
    "true",
    "yes",
    "on",
)
ZOHO_MAIL_API_BASE = (os.environ.get("ZOHO_MAIL_API_BASE", "https://mail.zoho.com/api") or "").rstrip("/")
ZOHO_MAIL_API_DOMAIN = (os.environ.get("ZOHO_MAIL_API_DOMAIN", "") or "").strip().rstrip("/")
ZOHO_MAIL_ORG_ID = (os.environ.get("ZOHO_MAIL_ORG_ID", "") or "").strip()
ZOHO_MAIL_DOMAIN = (os.environ.get("ZOHO_MAIL_DOMAIN", "lynkr.club") or "lynkr.club").strip().lower()

EMAIL_INGEST_ENABLED = (os.environ.get("EMAIL_INGEST_ENABLED", "1") or "1").strip().lower() in ("1", "true", "yes", "on")
EMAIL_INGEST_POLL_SECONDS = max(30, int(os.environ.get("EMAIL_INGEST_POLL_SECONDS", "90")))
EMAIL_INGEST_BATCH_SIZE = max(1, min(200, int(os.environ.get("EMAIL_INGEST_BATCH_SIZE", "25"))))

UPLOADS_DIR = BACKEND_ROOT / "uploads" / "catalog"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
PROFILE_UPLOADS_DIR = BACKEND_ROOT / "uploads" / "profiles"
PROFILE_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 15 * 1024 * 1024

SIGNUP_DISABLED = (os.environ.get("SIGNUP_DISABLED", "1") or "").strip().lower() in ("1", "true", "yes", "on")
PILOT_LAUNCHING_MESSAGE = (
    "Pilot launching soon! We're not accepting new signups right now. Join the waitlist to be notified."
)

WAITLIST_MAX_BRANDS = 50
WAITLIST_RECENT_LIMIT = 20
