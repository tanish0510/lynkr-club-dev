"""User profile and favorites."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['users'])

# ============ USER ENDPOINTS ============

@router.get("/user/me")
async def get_current_user_info(user: User = Depends(get_current_user)):
    if user.role == UserRole.PARTNER:
        partner = await db.partners.get_by_id(user.id)
        return {
            "id": user.id,
            "email": partner.get("contact_email", "") if partner else user.email,
            "full_name": (partner.get("contact_person") or partner.get("business_name", "")) if partner else user.full_name,
            "role": "PARTNER",
            "must_change_password": partner.get("must_change_password", False) if partner else False,
            "partner_id": user.id,
            "partner_logo": partner.get("logo") if partner else None,
            "extracted_palette": partner.get("extracted_palette") if partner else None,
            "username": user.username,
            "phone": partner.get("contact_phone", "") if partner else "",
            "dob": "",
            "gender": "",
            "lynkr_email": "",
            "points": 0,
            "email_verified": True,
            "avatar": user.avatar,
            "profile_photo": None,
            "onboarding_complete": True,
            "notification_preferences": {},
            "privacy_settings": {},
            "theme_colors": None,
        }

    partner_logo = None
    extracted_palette = None
    user_doc = await db.users.get_by_id(user.id)
    if user_doc:
        extracted_palette = user_doc.get("extracted_palette")
    return UserResponse(
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
        profile_photo=user.profile_photo,
        partner_logo=partner_logo,
        extracted_palette=extracted_palette,
        onboarding_complete=user.onboarding_complete,
        notification_preferences=user.notification_preferences,
        privacy_settings=user.privacy_settings,
        theme_colors=user.theme_colors,
        referral_code=user_doc.get("referral_code") if user_doc else None,
    )

@router.put("/user/profile")
async def update_profile(update: UserProfileUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}

    if "username" in update_data:
        normalized_username = normalize_username(update_data["username"])
        if not USERNAME_REGEX.fullmatch(normalized_username):
            raise HTTPException(
                status_code=400,
                detail="Username must be 3-20 chars and contain only lowercase letters, numbers, or underscore",
            )
        if normalized_username != user.username:
            user_record = await db.users.get_by_id(user.id)
            changed_at = user_record.get("username_changed_at") if user_record else None
            if changed_at:
                try:
                    changed_time = datetime.fromisoformat(changed_at)
                    if datetime.now(timezone.utc) - changed_time < timedelta(hours=USERNAME_CHANGE_COOLDOWN_HOURS):
                        raise HTTPException(
                            status_code=429,
                            detail=f"You can change username once every {USERNAME_CHANGE_COOLDOWN_HOURS} hours",
                        )
                except ValueError:
                    pass

            if await db.users.username_exists(normalized_username, exclude_id=user.id):
                raise HTTPException(status_code=400, detail="Username is already taken")
            update_data["username"] = normalized_username
            update_data["username_changed_at"] = datetime.now(timezone.utc).isoformat()
        else:
            update_data.pop("username", None)

    if "avatar" in update_data:
        avatar = (update_data.get("avatar") or "").strip()
        if not is_valid_avatar(avatar):
            raise HTTPException(status_code=400, detail="Please select a valid avatar")
        update_data["avatar"] = avatar

    if 'dob' in update_data:
        update_data['dob'] = update_data['dob'].isoformat()
    
    if update_data:
        await db.users.update_one(user.id, **update_data)
    
    return {"success": True, "message": "Profile updated"}

@router.post("/user/change-password")
async def change_password(password_change: PasswordChange, user: User = Depends(get_current_user)):
    if not verify_password(password_change.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    new_hash = hash_password(password_change.new_password)
    await db.users.update_one(user.id, password_hash=new_hash)
    
    return {"success": True, "message": "Password changed successfully"}

@router.put("/user/notification-preferences")
async def update_notification_preferences(prefs: NotificationPreferencesUpdate, user: User = Depends(get_current_user)):
    update_fields = {k: v for k, v in prefs.model_dump().items() if v is not None}
    
    if update_fields:
        user_doc = await db.users.get_by_id(user.id) or {}
        merged = {**(user_doc.get("notification_preferences") or {}), **update_fields}
        await db.users.update_one(user.id, notification_preferences=merged)
    
    return {"success": True, "message": "Notification preferences updated"}

@router.put("/user/privacy-settings")
async def update_privacy_settings(settings: PrivacySettingsUpdate, user: User = Depends(get_current_user)):
    update_fields = {k: v for k, v in settings.model_dump().items() if v is not None}
    
    if update_fields:
        user_doc = await db.users.get_by_id(user.id) or {}
        merged = {**(user_doc.get("privacy_settings") or {}), **update_fields}
        await db.users.update_one(user.id, privacy_settings=merged)
    
    return {"success": True, "message": "Privacy settings updated"}


@router.put("/user/theme-colors")
async def update_theme_colors(request: Request, user: User = Depends(get_current_user)):
    body = await request.json()
    allowed = {"primary", "secondary", "accent", "gradientFrom", "gradientTo", "glowColor", "cardBorder", "softTint", "accentMuted", "complementary"}
    theme = {k: v for k, v in body.items() if k in allowed and isinstance(v, str)}
    if theme:
        user_doc = await db.users.get_by_id(user.id) or {}
        merged = {**(user_doc.get("theme_colors") or {}), **theme}
        await db.users.update_one(user.id, theme_colors=merged)
    return {"success": True}


def _extract_palette_from_bytes(image_bytes: bytes, num_colors: int = 6) -> list:
    """Extract dominant colors from image bytes using Pillow k-means quantization."""
    from PIL import Image as PILImage
    import io
    img = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((150, 150))
    quantized = img.quantize(colors=num_colors, method=PILImage.Quantize.MEDIANCUT)
    palette_data = quantized.getpalette()
    if not palette_data:
        return []
    colors = []
    for i in range(num_colors):
        r, g, b = palette_data[i * 3], palette_data[i * 3 + 1], palette_data[i * 3 + 2]
        colors.append({"r": r, "g": g, "b": b, "hex": f"#{r:02x}{g:02x}{b:02x}"})
    return colors


@router.post("/user/profile-photo/upload")
async def upload_profile_photo(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are allowed")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = PROFILE_UPLOADS_DIR / filename

    with open(filepath, "wb") as f:
        f.write(contents)

    photo_url = f"/api/uploads/profiles/{filename}"
    try:
        extracted = _extract_palette_from_bytes(contents, 6)
    except Exception:
        extracted = []
    await db.users.update_one(
        user.id,
        profile_photo=photo_url,
        extracted_palette=extracted,
    )
    return {"url": photo_url, "filename": filename, "palette": extracted}


@router.delete("/user/profile-photo")
async def delete_profile_photo(user: User = Depends(get_current_user)):
    user_data = await db.users.get_by_id(user.id)
    old_photo = user_data.get("profile_photo") if user_data else None
    if old_photo:
        old_path = PROFILE_UPLOADS_DIR / old_photo.split("/")[-1]
        if old_path.exists():
            old_path.unlink(missing_ok=True)
    await db.users.update_one(user.id, profile_photo=None, theme_colors=None)
    return {"success": True}


@router.delete("/user/account")
async def delete_account(user: User = Depends(get_current_user)):
    # Delete user data
    await db.users.delete_one(user.id)
    await db.purchases.delete_many_by_user(user.id)
    await db.points_ledger.delete_many_by_user(user.id)
    await db.chat_messages.delete_many_by_user(user.id)
    
    return {"success": True, "message": "Account deleted"}

@router.post("/user/complete-onboarding")
async def complete_onboarding(user: User = Depends(get_current_user)):
    await db.users.update_one(user.id, onboarding_complete=True)
    return {"success": True}

@router.get("/user/dashboard")
async def get_dashboard(user: User = Depends(get_current_user)):
    # Get current month purchases
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    purchases = await db.purchases.find_by_user_since(user.id, since=month_start, limit=100)
    
    # Calculate this month spending
    month_spending = sum(p['amount'] for p in purchases if p['status'] == PurchaseStatus.VERIFIED)
    
    # Get recent purchases
    recent = await db.purchases.find_by_user(user.id, limit=5)
    
    coupon_docs = await db.coupons.find_active_available(limit=12)
    rewards = [
        {
            "id": c["id"],
            "name": c["title"],
            "points": c["points_cost"],
            "value": c["value"],
            "partner_logo": c.get("brand_logo") or c.get("partner_logo"),
            "title": c["title"],
            "points_cost": c["points_cost"],
        }
        for c in coupon_docs
    ]

    purchases_count = await db.purchases.count_by_user(user.id)
    coupons_redeemed_count = await db.redemptions.count_by_user(user.id)

    pending_purchases = sum(1 for p in recent if p['status'] == PurchaseStatus.PENDING)
    total_savings = int(month_spending * 0.025) if month_spending > 0 else 0

    return {
        "points": user.points,
        "month_spending": month_spending,
        "purchases_count": purchases_count,
        "coupons_redeemed_count": coupons_redeemed_count,
        "pending_purchases": pending_purchases,
        "total_savings": total_savings,
        "recent_purchases": [
            PurchaseResponse(
                id=p['id'],
                brand=p['brand'],
                order_id=p['order_id'],
                amount=p['amount'],
                status=p['status'],
                category=p.get('category'),
                timestamp=p['timestamp']
            ) for p in recent
        ],
        "available_rewards": rewards
    }


# ============ FAVORITE STORES ============

@router.get("/user/favorite-stores")
async def get_favorite_stores(user: User = Depends(get_current_user)):
    doc = await db.user_favorite_stores.get_by_user(user.id)
    return doc.get("store_ids", []) if doc else []


@router.post("/user/favorite-stores/{partner_id}")
async def add_favorite_store(partner_id: str, user: User = Depends(get_current_user)):
    partner = await db.partners.get_by_id(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Store not found")
    await db.user_favorite_stores.add_store(user.id, partner_id)
    return {"success": True}


@router.delete("/user/favorite-stores/{partner_id}")
async def remove_favorite_store(partner_id: str, user: User = Depends(get_current_user)):
    await db.user_favorite_stores.remove_store(user.id, partner_id)
    return {"success": True}

