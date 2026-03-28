"""Admin bootstrap."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['setup'])

@router.post("/setup/create-admin")
async def create_admin_user(payload: CreateAdminRequest):
    """
    Create the first (or additional) admin user. Requires ADMIN_CREATE_SECRET in env.
    Call once to bootstrap an admin, then use /api/auth/login with that user to access admin endpoints.
    """
    secret = (os.environ.get("ADMIN_CREATE_SECRET") or "").strip()
    if not secret:
        raise HTTPException(
            status_code=503,
            detail="Admin creation is not configured. Set ADMIN_CREATE_SECRET in the server environment.",
        )
    if payload.secret != secret:
        raise HTTPException(status_code=403, detail="Invalid secret")

    normalized_email = normalize_email(str(payload.email))
    if len((payload.password or "").strip()) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    username = normalize_username(payload.username)
    if not USERNAME_REGEX.fullmatch(username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-20 chars and contain only lowercase letters, numbers, or underscore",
        )

    existing_email = await db.users.get_by_email(normalized_email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = await db.users.get_by_username(username)
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        full_name=(payload.full_name or "").strip() or "Admin",
        username=username,
        phone="",
        dob=datetime.now(timezone.utc).date().isoformat(),
        gender="",
        role=UserRole.ADMIN,
        lynkr_email=generate_lynkr_email(username),
        email_verified=True,
        avatar=DEFAULT_AVATAR,
    )
    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.users.insert_one(doc)

    return {
        "success": True,
        "message": "Admin user created. Use this email and password to log in.",
        "user_id": user.id,
        "email": user.email,
        "username": user.username,
    }

