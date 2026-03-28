"""FastAPI dependencies (auth, roles)."""
from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials

from app.core import config as cfg
from app.core.security import security
from app.db.database import db
from app.schemas.api.domain_models import User, UserRole
from app.services.business_logic import ensure_user_identity
from security import log_security_event


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, cfg.JWT_SECRET, algorithms=[cfg.JWT_ALGORITHM])
        sub = payload.get("sub")
        role = payload.get("role")
        if sub is None:
            log_security_event("INVALID_JWT", request, "missing_sub", status_code=401)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        if role == UserRole.PARTNER:
            partner = await db.partners.get_by_id(sub)
            if partner is None:
                log_security_event("INVALID_JWT", request, "partner_not_found", user_id=sub, status_code=401)
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Partner not found")
            return User(
                id=partner["id"],
                email=partner.get("contact_email", ""),
                password_hash=partner.get("password_hash", ""),
                full_name=partner.get("contact_person") or partner.get("business_name", ""),
                username=partner.get("contact_email", "").split("@")[0],
                phone=partner.get("contact_phone") or "",
                dob="",
                gender="",
                role=UserRole.PARTNER,
                lynkr_email="",
                email_verified=True,
                partner_id=partner["id"],
            )

        user = await db.users.get_by_id(sub)
        if user is None:
            log_security_event("INVALID_JWT", request, "user_not_found", user_id=sub, status_code=401)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        user = await ensure_user_identity(user)
        return User(**user)
    except jwt.ExpiredSignatureError:
        log_security_event("JWT_EXPIRED", request, "token_expired", status_code=401)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError as e:
        log_security_event("INVALID_JWT", request, str(e) or "invalid_token", status_code=401)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def require_role(user: User, required_role: str):
    if user.role != required_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
