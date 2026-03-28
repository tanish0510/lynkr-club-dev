"""API root."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['meta'])

@router.get("/")
async def api_root():
    return {
        "message": "Lynkr API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "endpoints": {
            "auth": "/api/auth/login, /api/auth/signup, /api/auth/verify-email",
            "user": "/api/user/me",
            "chat": "/api/chat"
        }
    }

