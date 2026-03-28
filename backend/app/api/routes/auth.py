"""Auth, leads, waitlist."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['auth'])

# ============ AUTH ENDPOINTS ============

@router.get("/auth/check-username", response_model=UsernameAvailabilityResponse)
async def check_username(username: str):
    normalized = normalize_username(username)
    if not USERNAME_REGEX.fullmatch(normalized):
        return UsernameAvailabilityResponse(
            username=username,
            normalized_username=normalized,
            available=False,
            hint="Use 3-20 lowercase characters: letters, numbers, underscore",
        )

    taken = await db.users.username_exists(normalized)
    return UsernameAvailabilityResponse(
        username=username,
        normalized_username=normalized,
        available=not taken,
        hint="Available" if not taken else "Username is already taken",
    )


@router.post("/auth/send-signup-otp")
async def send_signup_otp(body: RequestSignupOtp):
    if SIGNUP_DISABLED:
        raise HTTPException(status_code=503, detail=PILOT_LAUNCHING_MESSAGE)
    normalized_email = normalize_email(str(body.email))
    existing = await db.users.get_by_email(normalized_email)
    if existing:
        # Do not reveal that email is registered (prevent account enumeration)
        return {"success": True, "message": "If your email is not already registered, you will receive a verification code."}
    otp = generate_verification_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_OTP_EXPIRE_MINUTES)
    await db.signup_otps.delete_by_email(normalized_email)
    await db.signup_otps.insert_one({
        "email": normalized_email,
        "otp": otp,
        "expires_at": expires_at.isoformat(),
    })
    asyncio.create_task(
        send_verification_email(normalized_email, "", "there", otp=otp)
    )
    return {"success": True, "message": "Verification code sent to your email"}


@router.post("/leads")
async def submit_lead(body: LeadSignupRequest):
    """Store email from landing/partner guide signup forms. Public, no auth required."""
    source = (body.source or "landing").strip().lower()
    if source not in ("landing", "partner"):
        source = "landing"
    normalized_email = normalize_email(str(body.email))
    doc = {
        "email": normalized_email,
        "source": source,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.leads.insert_one(doc)
    return {"success": True, "message": "Thanks! We'll be in touch."}


# ---------- Waitlist (early access, JSON file) ----------
WAITLIST_MAX_BRANDS = 50
WAITLIST_RECENT_LIMIT = 20

from services.waitlist_file import (
    email_exists as waitlist_email_exists,
    append_entry as waitlist_append_entry,
    get_recent_entries as waitlist_get_recent,
)


@router.post("/waitlist")
async def waitlist_signup(body: WaitlistSignupRequest):
    """Public waitlist signup. Stores in backend JSON file; prevents duplicate email."""
    normalized_email = normalize_email(str(body.email))
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    age = (body.age or "").strip()[:20]
    gender = (body.gender or "").strip()[:40]
    brands = [b.strip() for b in (body.favorite_brands or []) if b and isinstance(b, str)][:WAITLIST_MAX_BRANDS]
    city = (body.city or "").strip()[:80] or ""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

    try:
        if await asyncio.to_thread(waitlist_email_exists, normalized_email):
            raise HTTPException(status_code=400, detail="You are already on the waitlist.")

        await asyncio.to_thread(
            waitlist_append_entry,
            timestamp=timestamp,
            name=name,
            email=normalized_email,
            age=age,
            gender=gender,
            favorite_brands=brands,
            city=city,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Waitlist file write error: %s", e)
        raise HTTPException(
            status_code=503,
            detail="Waitlist submission failed. Please try again later.",
        ) from e

    return {
        "status": "success",
        "success": True,
        "message": "Waitlist joined successfully",
    }


@router.get("/waitlist/recent")
async def waitlist_recent(limit: int = 10):
    """Public. Returns recent waitlist entries from JSON file for live-activity popup."""
    cap = min(max(1, limit), WAITLIST_RECENT_LIMIT)
    try:
        entries = await asyncio.to_thread(waitlist_get_recent, limit=cap)
        return {"entries": entries}
    except Exception as e:
        logger.warning("Waitlist recent failed: %s", e)
        return {"entries": []}


@router.post("/auth/signup")
async def signup(user_data: UserSignup):
    if SIGNUP_DISABLED:
        raise HTTPException(status_code=503, detail=PILOT_LAUNCHING_MESSAGE)
    if not user_data.terms_accepted:
        raise HTTPException(status_code=400, detail="You must read and accept the Terms and Conditions to sign up")
    normalized_email = normalize_email(str(user_data.email))
    username = normalize_username(user_data.username)
    if len((user_data.password or "").strip()) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not USERNAME_REGEX.fullmatch(username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-20 chars and contain only lowercase letters, numbers, or underscore",
        )
    avatar = (user_data.avatar or "").strip()
    if not is_valid_avatar(avatar):
        raise HTTPException(status_code=400, detail="Please select a valid avatar")

    # Check if user exists
    existing = await db.users.get_by_email(normalized_email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if await db.users.username_or_lynkr_email_exists(username, generate_lynkr_email(username)):
        raise HTTPException(status_code=400, detail="Username is already taken")

    # Verify signup OTP if provided (email verified during signup)
    email_verified = False
    signup_otp_clean = (user_data.signup_otp or "").strip().replace(" ", "")
    if len(signup_otp_clean) == 6 and signup_otp_clean.isdigit():
        doc_otp = await db.signup_otps.find_by_email(normalized_email)
        if doc_otp:
            try:
                expires_at = datetime.fromisoformat(doc_otp["expires_at"].replace("Z", "+00:00"))
            except Exception:
                expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
            if datetime.now(timezone.utc) <= expires_at and doc_otp.get("otp") == signup_otp_clean:
                email_verified = True
                await db.signup_otps.delete_by_email(normalized_email)
            else:
                if datetime.now(timezone.utc) > expires_at:
                    await db.signup_otps.delete_by_email(normalized_email)
                    raise HTTPException(status_code=400, detail="Verification code expired. Request a new code.")
                raise HTTPException(status_code=400, detail="Invalid verification code")
        else:
            raise HTTPException(status_code=400, detail="Verification code expired or invalid. Request a new code.")
    else:
        raise HTTPException(status_code=400, detail="Please enter the 6-digit verification code sent to your email")

    verification_token = generate_verification_token() if not email_verified else None

    # Create user (email already verified when signup_otp was valid)
    user = User(
        email=normalized_email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        username=username,
        avatar=avatar,
        phone=user_data.phone,
        dob=user_data.dob.isoformat(),
        gender=user_data.gender,
        role=user_data.role,
        lynkr_email="",
        verification_token=verification_token,
    )
    user.lynkr_email = generate_lynkr_email(username)
    if email_verified:
        user.email_verified = True
        user.verification_token = None

    # Provision Lynkr mailbox if enabled; do not block signup on failure
    zoho_provisioned = await provision_zoho_mailbox_if_enabled(
        username=username,
        full_name=user.full_name,
        email_address=user.lynkr_email,
        mailbox_password=user_data.password,
    )
    if ZOHO_MAIL_ENABLED and not zoho_provisioned:
        logging.warning("Zoho mailbox provisioning failed for %s; user created without mailbox", user.lynkr_email)

    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()

    # Generate unique referral code
    ref_prefix = (username or "USER")[:4].upper()
    ref_code = f"{ref_prefix}-LYNK"
    counter = 1
    while await db.users.referral_code_exists(ref_code):
        ref_code = f"{ref_prefix}-LYNK{counter}"
        counter += 1
    doc["referral_code"] = ref_code

    # Handle incoming referral code from inviter
    inviter_id = None
    incoming_ref = (user_data.referral_code or "").strip().upper()
    if incoming_ref:
        inviter = await db.users.get_by_referral_code(incoming_ref)
        if inviter and inviter["id"] != user.id:
            doc["referred_by"] = inviter["id"]
            inviter_id = inviter["id"]

    if not email_verified:
        verification_otp = generate_verification_otp()
        otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_OTP_EXPIRE_MINUTES)
        doc["verification_otp"] = verification_otp
        doc["verification_otp_expires_at"] = otp_expires_at.isoformat()
    await db.users.insert_one(doc)

    if inviter_id:
        try:
            await db.referrals.insert_one({
                "inviter_id": inviter_id,
                "invitee_id": user.id,
                "reward_given": False,
            })
        except Exception:
            pass  # non-blocking

    if not email_verified:
        asyncio.create_task(send_verification_email(user.email, verification_token or "", user.full_name, otp=doc.get("verification_otp")))

    token = create_access_token({"sub": user.id, "role": user.role})

    return {
        "token": token,
        "user": UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            username=user.username,
            phone=user.phone,
            dob=user.dob,
            gender=user.gender,
            role=user.role,
            lynkr_email=user.lynkr_email,
            points=user.points,
            email_verified=user.email_verified,
            avatar=user.avatar,
            onboarding_complete=user.onboarding_complete,
            notification_preferences=user.notification_preferences,
            privacy_settings=user.privacy_settings,
            referral_code=ref_code,
        )
    }

@router.get("/auth/verify-email")
async def verify_email(token: str):
    user = await db.users.get_by_verification_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="Invalid verification token")
    
    await db.users.update_one(user['id'], email_verified=True, verification_token=None)
    
    return {"success": True, "message": "Email verified successfully"}


@router.post("/auth/verify-email-otp")
async def verify_email_otp(body: VerifyEmailOtpRequest):
    normalized_email = normalize_email(str(body.email))
    otp_digits = (body.otp or "").strip().replace(" ", "")
    if len(otp_digits) != 6 or not otp_digits.isdigit():
        raise HTTPException(status_code=400, detail="Please enter a valid 6-digit code")
    user = await db.users.get_by_email(normalized_email)
    if not user:
        raise HTTPException(status_code=404, detail="No account found for this email")
    if user.get("email_verified"):
        return {"success": True, "message": "Email already verified"}
    stored_otp = user.get("verification_otp")
    expires_at_str = user.get("verification_otp_expires_at")
    if not stored_otp or not expires_at_str:
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")
    try:
        expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")
    if datetime.now(timezone.utc) > expires_at:
        await db.users.update_one(
            user["id"],
            verification_otp=None,
            verification_otp_expires_at=None,
        )
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")
    if otp_digits != stored_otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    await db.users.update_one(
        user["id"],
        email_verified=True,
        verification_token=None,
        verification_otp=None,
        verification_otp_expires_at=None,
    )
    return {"success": True, "message": "Email verified successfully"}


@router.post("/auth/resend-verification")
async def resend_verification(user: User = Depends(get_current_user)):
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    verification_token = generate_verification_token()
    verification_otp = generate_verification_otp()
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_OTP_EXPIRE_MINUTES)
    await db.users.update_one(
        user.id,
        verification_token=verification_token,
        verification_otp=verification_otp,
        verification_otp_expires_at=otp_expires_at.isoformat(),
    )
    asyncio.create_task(
        send_verification_email(user.email, verification_token, user.full_name, otp=verification_otp)
    )
    return {"success": True, "message": "Verification email sent"}


@router.post("/auth/login")
async def login(request: Request, login_data: UserLogin):
    ip = _get_client_ip(request)
    normalized_email = normalize_email(str(login_data.email))
    # Brute force: block if too many recent failures (by IP or by email)
    if await brute_force_storage.is_locked(ip, normalized_email):
        log_security_event("LOGIN_LOCKED", request, f"lock_duration_min={BRUTE_FORCE_LOCK_MINUTES}")
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Please try again later.",
        )
    user = await db.users.get_by_email(normalized_email)
    if not user:
        user = await db.users.get_by_email_case_insensitive(normalized_email)
    if not user:
        await brute_force_storage.record_failure(ip, normalized_email)
        log_security_event("LOGIN_FAILED", request, "invalid_credentials")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    try:
        if not verify_password(login_data.password, user.get("password_hash") or ""):
            await brute_force_storage.record_failure(ip, normalized_email)
            log_security_event("LOGIN_FAILED", request, "invalid_credentials")
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception:
        await brute_force_storage.record_failure(ip, normalized_email)
        log_security_event("LOGIN_FAILED", request, "invalid_credentials")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    await brute_force_storage.clear_on_success(ip, normalized_email)
    user = await ensure_user_identity(user)
    # Normalize for response (JSON may deserialize dates as strings, etc.)
    def _str(v):
        if v is None: return ""
        if hasattr(v, "isoformat"): return v.isoformat().split("T")[0] if hasattr(v, "date") else str(v)
        return str(v)
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return {
        "token": token,
        "user": UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            username=user.get("username"),
            phone=_str(user.get("phone")),
            dob=_str(user.get("dob")),
            gender=_str(user.get("gender")),
            role=user["role"],
            lynkr_email=user.get("lynkr_email") or "",
            points=int(user.get("points") or 0),
            email_verified=bool(user.get("email_verified")),
            avatar=user.get("avatar") or DEFAULT_AVATAR,
            profile_photo=user.get("profile_photo"),
            onboarding_complete=bool(user.get("onboarding_complete")),
            notification_preferences=user.get("notification_preferences") or {},
            privacy_settings=user.get("privacy_settings") or {},
            theme_colors=user.get("theme_colors"),
        )
    }
