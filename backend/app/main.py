"""FastAPI application factory and ASGI entry (`app` instance)."""
from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path

import mimetypes
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware

from sqlalchemy import text as sa_text

from pgdoc import init_schema, set_request_session_middleware, worker_session_scope
from pgdoc.session import get_engine

from app import state
from app.api.routes import api_router
from app.core import config as cfg
from app.db.database import db
from app.services.business_logic import run_email_ingest_cycle
from security import SECURITY_HEADERS, SecurityMiddleware, log_security_event
from services.email_ingest_service import EmailIngestService

app = FastAPI(
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.include_router(api_router)

_uploads_root = cfg.BACKEND_ROOT / "uploads"
_UPLOAD_CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Cache-Control": "public, max-age=86400",
}


@app.options("/api/uploads/{subdir:path}")
async def uploads_preflight(subdir: str):
    return JSONResponse(content="", headers=_UPLOAD_CORS)


@app.get("/api/uploads/{subdir:path}")
async def serve_upload(subdir: str):
    safe = Path(subdir)
    if ".." in safe.parts:
        raise HTTPException(status_code=400, detail="Invalid path")
    filepath = _uploads_root / safe
    if not filepath.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    mt = mimetypes.guess_type(str(filepath))[0] or "application/octet-stream"
    return FileResponse(filepath, media_type=mt, headers=_UPLOAD_CORS)


def _api_response_headers():
    return dict(SECURITY_HEADERS)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    headers = _api_response_headers()
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail if exc.status_code != 404 else "API endpoint not found. Check /api/docs for available endpoints.",
                "path": request.url.path,
                "method": request.method,
            },
            headers=headers,
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    err_list = exc.errors() if hasattr(exc, "errors") and callable(getattr(exc, "errors")) else []
    err_summary = str(err_list)[:300] if err_list else "validation_error"
    log_security_event("MALFORMED_PAYLOAD", request, err_summary)
    return JSONResponse(
        status_code=422,
        content={"detail": err_list},
        headers=_api_response_headers(),
    )


app.add_middleware(
    SecurityMiddleware,
    general_per_minute=int(os.environ.get("SECURITY_RATE_LIMIT_GENERAL", "300")),
    auth_per_minute=int(os.environ.get("SECURITY_RATE_LIMIT_AUTH", "10")),
    max_body_bytes=int(os.environ.get("SECURITY_MAX_BODY_BYTES", str(16 * 1024 * 1024))),
    request_timeout_seconds=float(os.environ.get("SECURITY_REQUEST_TIMEOUT", "60")),
)

_cors_origins_raw = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173",
)
_cors_origins_list = [o.strip() for o in _cors_origins_raw.split(",") if o.strip() and o.strip() != "*"] or [
    cfg.FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins_list,
    allow_origin_regex=os.environ.get(
        "CORS_ORIGIN_REGEX",
        r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$",
    ),
    allow_methods=["*"],
    allow_headers=["*"],
)
set_request_session_middleware(app)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


async def _email_ingest_worker():
    logger.info("Email ingest worker started (interval=%ss)", cfg.EMAIL_INGEST_POLL_SECONDS)
    while not state.email_ingest_stop_event.is_set():
        try:
            async with worker_session_scope():
                result = await run_email_ingest_cycle()
            if result.get("processed", 0) > 0:
                logger.info("Email ingest cycle: %s", result)
        except Exception as exc:
            logger.error("Email ingest cycle failed: %s", exc)
        try:
            await asyncio.wait_for(state.email_ingest_stop_event.wait(), timeout=cfg.EMAIL_INGEST_POLL_SECONDS)
        except asyncio.TimeoutError:
            continue
    logger.info("Email ingest worker stopped")


async def _apply_migrations(engine) -> None:
    """Add columns that create_all can't add to existing tables."""
    alter_stmts = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(30) UNIQUE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(36)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS has_made_first_purchase BOOLEAN NOT NULL DEFAULT FALSE",
        # Dynamic coupons — ensure all columns exist on pre-existing tables
        "ALTER TABLE dynamic_coupon_requests ADD COLUMN IF NOT EXISTS config_id VARCHAR(36)",
        "ALTER TABLE dynamic_coupon_requests ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255)",
        "ALTER TABLE dynamic_coupon_requests ADD COLUMN IF NOT EXISTS requested_amount INTEGER",
        "ALTER TABLE dynamic_coupon_requests ADD COLUMN IF NOT EXISTS points_used INTEGER",
        "ALTER TABLE dynamic_coupon_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'",
        "ALTER TABLE dynamic_coupon_requests ADD COLUMN IF NOT EXISTS admin_note TEXT",
        "ALTER TABLE dynamic_coupon_requests ADD COLUMN IF NOT EXISTS gift_card_id VARCHAR(36)",
        "ALTER TABLE dynamic_coupon_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()",
        # Return window feature
        "ALTER TABLE partners ADD COLUMN IF NOT EXISTS return_window_days SMALLINT NOT NULL DEFAULT 0",
        "ALTER TABLE purchases ADD COLUMN IF NOT EXISTS points_credited BOOLEAN NOT NULL DEFAULT TRUE",
    ]
    try:
        async with engine.begin() as conn:
            for stmt in alter_stmts:
                await conn.execute(sa_text(stmt))
    except Exception as e:
        logger.warning("Migration step skipped: %s", e)


@app.on_event("startup")
async def startup_db():
    try:
        await init_schema()
        engine = get_engine()
        if engine:
            await _apply_migrations(engine)
        logger.info("PostgreSQL schema ready (ORM tables created)")
    except Exception as e:
        logger.warning("PostgreSQL startup failed: %s", e)

    try:
        state.email_ingest_service = EmailIngestService(db=db)
        state.email_ingest_stop_event.clear()
        if cfg.EMAIL_INGEST_ENABLED:
            state.email_ingest_task = asyncio.create_task(_email_ingest_worker())
        else:
            logger.info("Email ingest worker is disabled via EMAIL_INGEST_ENABLED")
    except Exception as e:
        logger.warning("Email ingest service not started: %s", e)
        state.email_ingest_task = None


@app.on_event("shutdown")
async def shutdown_db_client():
    state.email_ingest_stop_event.set()
    if state.email_ingest_task:
        try:
            await asyncio.wait_for(state.email_ingest_task, timeout=5)
        except Exception:
            state.email_ingest_task.cancel()
        state.email_ingest_task = None
    eng = get_engine()
    if eng is not None:
        await eng.dispose()
