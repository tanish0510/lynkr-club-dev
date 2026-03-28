"""
Application-level security: rate limiting, brute force protection, bot detection,
security headers, payload limits, and security event logging.

Uses in-memory storage (no Redis). For distributed deployments, replace
RateLimitStorage and BruteForceStorage with Redis-backed implementations.
"""

import asyncio
import logging
import time
from collections import defaultdict
from typing import Callable, Optional, Set, Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger("lynkr.security")

# --- Config (env overrides in server.py when wiring) ---
GENERAL_RATE_LIMIT_PER_MINUTE = 300
AUTH_RATE_LIMIT_PER_MINUTE = 10
BRUTE_FORCE_MAX_ATTEMPTS = 5
BRUTE_FORCE_LOCK_MINUTES = 10
MAX_BODY_BYTES = 16 * 1024 * 1024  # 16MB
REQUEST_TIMEOUT_SECONDS = 60
# Reject requests with no user-agent or obviously automated scraping user-agents
BOT_USER_AGENT_SUBSTRINGS = ("bot", "crawler", "spider", "scrapy")
MIN_USER_AGENT_LENGTH = 5
# Paths that use strict auth rate limit (5/min per IP)
AUTH_PATHS: Set[str] = {
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/send-signup-otp",
    "/api/auth/resend-verification",
    "/api/partner/auth/login",
}


def _is_auth_path(path: str) -> bool:
    for p in AUTH_PATHS:
        if path == p or path.rstrip("/") == p.rstrip("/"):
            return True
    return False


# --- In-memory rate limiter (sliding window per key) ---
class RateLimitStorage:
    """In-memory sliding window: key -> list of timestamps."""

    def __init__(self, window_seconds: int = 60):
        self._data: dict[str, list[float]] = defaultdict(list)
        self._window = window_seconds
        self._lock = asyncio.Lock()

    async def is_exceeded(self, key: str, limit: int) -> bool:
        now = time.monotonic()
        async with self._lock:
            self._data[key] = [t for t in self._data[key] if now - t < self._window]
            if len(self._data[key]) >= limit:
                return True
            self._data[key].append(now)
            return False

    async def cleanup_old(self):
        """Periodic cleanup of stale keys (optional)."""
        pass


# --- Brute force: track failures and lock by IP and by identifier (email) ---
class BruteForceStorage:
    """Track failed login attempts. Lock for BRUTE_FORCE_LOCK_MINUTES after BRUTE_FORCE_MAX_ATTEMPTS."""

    def __init__(self):
        self._by_ip: dict[str, list[float]] = defaultdict(list)  # ip -> timestamps of failures
        self._by_id: dict[str, list[float]] = defaultdict(list)  # id (e.g. email) -> timestamps
        self._lock = asyncio.Lock()

    async def record_failure(self, ip: str, identifier: Optional[str] = None) -> None:
        now = time.time()
        async with self._lock:
            if not is_loopback_ip(ip):
                self._by_ip[ip].append(now)
            if identifier:
                self._by_id[identifier].append(now)

    async def is_locked(self, ip: str, identifier: Optional[str] = None) -> bool:
        now = time.time()
        window = BRUTE_FORCE_LOCK_MINUTES * 60
        async with self._lock:
            # Lock if this IP had >= N failures (skipped for loopback — dev shares 127.0.0.1 across accounts)
            if not is_loopback_ip(ip):
                ip_ts = [t for t in self._by_ip[ip] if now - t < window]
                self._by_ip[ip] = ip_ts
                if len(ip_ts) >= BRUTE_FORCE_MAX_ATTEMPTS:
                    return True
            if identifier:
                id_ts = [t for t in self._by_id[identifier] if now - t < window]
                self._by_id[identifier] = id_ts
                if len(id_ts) >= BRUTE_FORCE_MAX_ATTEMPTS:
                    return True
        return False

    async def clear_on_success(self, ip: str, identifier: Optional[str] = None) -> None:
        async with self._lock:
            if not is_loopback_ip(ip):
                self._by_ip.pop(ip, None)
            if identifier:
                self._by_id.pop(identifier, None)


# --- Singleton storages (in-memory; init at import so middleware can use them) ---
rate_limit_storage: RateLimitStorage = RateLimitStorage(window_seconds=60)
brute_force_storage: BruteForceStorage = BruteForceStorage()

# --- Body hash for repeated-payload bot detection (per IP, last N hashes) ---
_recent_body_hashes: dict[str, list[Tuple[float, str]]] = defaultdict(list)
_body_hash_lock = asyncio.Lock()
REPEATED_PAYLOAD_WINDOW = 10  # seconds
REPEATED_PAYLOAD_MAX_SAME = 5  # same body this many times in window → reject


def _get_client_ip(request: Request) -> str:
    """Prefer X-Forwarded-For (set by Nginx), fallback to client.host."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


def is_loopback_ip(ip: str) -> bool:
    """True for local dev clients. Brute-force IP lock skips these so 127.0.0.1 isn't one bucket for every account."""
    h = (ip or "").strip().lower()
    if not h:
        return False
    if h in ("localhost", "::1", "0:0:0:0:0:0:0:1"):
        return True
    if h.startswith("127."):
        return True
    return False


def _is_likely_bot_user_agent(ua: str) -> bool:
    if not ua or len(ua.strip()) < MIN_USER_AGENT_LENGTH:
        return True
    ua_lower = ua.strip().lower()
    for p in BOT_USER_AGENT_SUBSTRINGS:
        if p in ua_lower:
            return True
    return False


async def _check_repeated_payload(ip: str, body_hash: str) -> bool:
    """True if this IP sent the same body too many times recently (bot pattern)."""
    now = time.time()
    async with _body_hash_lock:
        _recent_body_hashes[ip] = [
            (t, h) for t, h in _recent_body_hashes[ip]
            if now - t < REPEATED_PAYLOAD_WINDOW
        ]
        same = sum(1 for _, h in _recent_body_hashes[ip] if h == body_hash)
        if same >= REPEATED_PAYLOAD_MAX_SAME:
            return True
        _recent_body_hashes[ip].append((now, body_hash))
    return False


def log_security_event(
    event: str,
    request: Request,
    detail: str,
    user_id: Optional[str] = None,
    status_code: Optional[int] = None,
):
    """Log security-related events for audit."""
    ip = _get_client_ip(request)
    path = request.url.path
    method = request.method
    extra = f" user_id={user_id}" if user_id else ""
    sc = f" status_code={status_code}" if status_code is not None else ""
    logger.warning(
        "SECURITY %s ip=%s method=%s path=%s detail=%s%s%s",
        event, ip, method, path, detail, extra, sc,
    )


# --- Security headers to add to every response ---
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Runs on every request: bot check, rate limit, body size, security headers.
    Does not perform brute-force checks (those are in route handlers for login).
    """

    def __init__(
        self,
        app,
        general_per_minute: int = GENERAL_RATE_LIMIT_PER_MINUTE,
        auth_per_minute: int = AUTH_RATE_LIMIT_PER_MINUTE,
        max_body_bytes: int = MAX_BODY_BYTES,
        request_timeout_seconds: float = REQUEST_TIMEOUT_SECONDS,
    ):
        super().__init__(app)
        self.general_per_minute = general_per_minute
        self.auth_per_minute = auth_per_minute
        self.max_body_bytes = max_body_bytes
        self.request_timeout_seconds = request_timeout_seconds

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        ip = _get_client_ip(request)
        path = request.url.path

        if path.startswith("/api/uploads/"):
            return await call_next(request)

        if request.method == "OPTIONS":
            return await call_next(request)

        # 1) Bot detection: reject missing or suspicious User-Agent
        user_agent = request.headers.get("user-agent") or ""
        if _is_likely_bot_user_agent(user_agent):
            log_security_event("BOT_REJECT_NO_UA", request, "missing or suspicious user-agent")
            return JSONResponse(
                status_code=403,
                content={"detail": "Forbidden"},
                headers=dict(SECURITY_HEADERS),
            )

        # 2) Rate limiting (per IP)
        global rate_limit_storage
        if rate_limit_storage:
            limit = self.auth_per_minute if _is_auth_path(path) else self.general_per_minute
            key = f"rl:{ip}:{path}" if _is_auth_path(path) else f"rl:{ip}"
            if await rate_limit_storage.is_exceeded(key, limit):
                log_security_event("RATE_LIMIT_EXCEEDED", request, f"limit={limit}/min", status_code=429)
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                    headers=dict(SECURITY_HEADERS),
                )

        # 3) Body size limit (only for methods that may have body)
        if request.method in ("POST", "PUT", "PATCH"):
            content_length = request.headers.get("content-length")
            if content_length:
                try:
                    cl = int(content_length)
                    if cl > self.max_body_bytes:
                        log_security_event("PAYLOAD_TOO_LARGE", request, f"content_length={cl}", status_code=413)
                        return JSONResponse(
                            status_code=413,
                            content={"detail": "Request body too large"},
                            headers=dict(SECURITY_HEADERS),
                        )
                except ValueError:
                    log_security_event("MALFORMED_HEADER", request, "invalid content-length", status_code=400)
                    return JSONResponse(
                        status_code=400,
                        content={"detail": "Invalid request"},
                        headers=dict(SECURITY_HEADERS),
                    )

        # 4) Optional: repeated identical body (read body once; Starlette allows receive() once)
        # We don't read body here to avoid consuming it; repeated-payload check can be done
        # in a middleware that buffers body (complex). Skip for now or do in auth routes only.
        # So we skip repeated-payload in middleware; could add later with a body buffer.

        # 5) Request timeout: wrap call_next in wait_for
        try:
            response = await asyncio.wait_for(
                call_next(request),
                timeout=self.request_timeout_seconds,
            )
        except asyncio.TimeoutError:
            log_security_event("REQUEST_TIMEOUT", request, f"timeout={self.request_timeout_seconds}s", status_code=504)
            return JSONResponse(
                status_code=504,
                content={"detail": "Request timeout"},
                headers=dict(SECURITY_HEADERS),
            )

        # 6) Add security headers to response
        if hasattr(response, "headers") and response.headers is not None:
            for k, v in SECURITY_HEADERS.items():
                response.headers.setdefault(k, v)

        return response
