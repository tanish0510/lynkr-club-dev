"""Admin API."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['admin'])


@router.get("/admin/users")
async def get_all_users(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    users = await db.users.find_by_role(UserRole.USER, exclude_fields={"password_hash"})
    for idx, user_item in enumerate(users):
        users[idx] = await ensure_user_identity(user_item)
    return users


@router.post("/admin/create-user")
async def admin_create_user(payload: AdminCreateUserRequest, user: User = Depends(get_current_user)):
    """
    Create a regular app user (role USER). No OTP or terms flow; user can log in immediately.
    Requires admin JWT.
    """
    await require_role(user, UserRole.ADMIN)

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

    dob_str = payload.dob or datetime.now(timezone.utc).date().isoformat()

    new_user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        full_name=(payload.full_name or "").strip() or "User",
        username=username,
        phone=(payload.phone or "").strip(),
        dob=dob_str,
        gender=(payload.gender or "").strip(),
        role=UserRole.USER,
        lynkr_email=generate_lynkr_email(username),
        email_verified=True,
        avatar=DEFAULT_AVATAR,
    )
    doc = new_user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.users.insert_one(doc)

    return {
        "success": True,
        "message": "User created. They can log in with email and password.",
        "user_id": new_user.id,
        "email": new_user.email,
        "username": new_user.username,
    }


@router.patch("/admin/users/{user_id}/points")
async def update_user_points(user_id: str, payload: UserPointsUpdate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    op = (payload.operation or "").lower().strip()
    if op not in {"add", "subtract", "set"}:
        raise HTTPException(status_code=400, detail="operation must be one of: add, subtract, set")
    if payload.points < 0:
        raise HTTPException(status_code=400, detail="points must be >= 0")

    target = await db.users.get_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    current_points = int(target.get("points", 0))
    if op == "add":
        new_points = current_points + int(payload.points)
        delta = int(payload.points)
    elif op == "subtract":
        if current_points < int(payload.points):
            raise HTTPException(status_code=400, detail="Insufficient points to subtract")
        new_points = current_points - int(payload.points)
        delta = -int(payload.points)
    else:  # set
        new_points = int(payload.points)
        delta = new_points - current_points

    await db.users.update_one(user_id, points=new_points)

    if delta != 0:
        ledger_type = "ADMIN_CREDIT" if delta > 0 else "ADMIN_DEBIT"
        reason = payload.reason or f"Admin points update ({op})"
        ledger_entry = PointsLedger(
            user_id=user_id,
            type=ledger_type,
            amount=abs(delta),
            description=reason,
            balance_after=new_points,
        )
        ledger_doc = ledger_entry.model_dump()
        ledger_doc["created_at"] = ledger_entry.created_at.isoformat()
        await db.points_ledger.insert_one(ledger_doc)

    return {
        "success": True,
        "user_id": user_id,
        "username": target.get("username"),
        "old_points": current_points,
        "new_points": new_points,
        "delta": delta,
    }


@router.patch("/admin/users/by-username/{username}/points")
async def update_user_points_by_username(username: str, payload: UserPointsUpdate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    op = (payload.operation or "").lower().strip()
    if op not in {"add", "subtract", "set"}:
        raise HTTPException(status_code=400, detail="operation must be one of: add, subtract, set")
    if payload.points < 0:
        raise HTTPException(status_code=400, detail="points must be >= 0")

    normalized_username = (username or "").strip().lower()
    target = await db.users.get_by_username(normalized_username)
    if not target:
        raise HTTPException(status_code=404, detail="User not found for username")

    current_points = int(target.get("points", 0))
    if op == "add":
        new_points = current_points + int(payload.points)
        delta = int(payload.points)
    elif op == "subtract":
        if current_points < int(payload.points):
            raise HTTPException(status_code=400, detail="Insufficient points to subtract")
        new_points = current_points - int(payload.points)
        delta = -int(payload.points)
    else:  # set
        new_points = int(payload.points)
        delta = new_points - current_points

    await db.users.update_one(target["id"], points=new_points)

    if delta != 0:
        ledger_type = "ADMIN_CREDIT" if delta > 0 else "ADMIN_DEBIT"
        reason = payload.reason or f"Admin points update ({op})"
        ledger_entry = PointsLedger(
            user_id=target["id"],
            type=ledger_type,
            amount=abs(delta),
            description=reason,
            balance_after=new_points,
        )
        ledger_doc = ledger_entry.model_dump()
        ledger_doc["created_at"] = ledger_entry.created_at.isoformat()
        await db.points_ledger.insert_one(ledger_doc)

    return {
        "success": True,
        "user_id": target["id"],
        "username": target.get("username"),
        "old_points": current_points,
        "new_points": new_points,
        "delta": delta,
    }

@router.get("/admin/partners")
async def get_all_partners(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    partners = await db.partners.find_all(exclude_fields={"password_hash"})
    return partners

@router.get("/admin/purchases")
async def get_all_purchases(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    purchases = await db.purchases.find_all()
    return purchases


@router.get("/admin/email-ingest/logs")
async def get_email_ingest_logs(limit: int = 100, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    max_limit = max(1, min(limit, 500))
    logs = await db.email_ingest_logs.find_recent(limit=max_limit)
    return logs


@router.post("/admin/email-ingest/run")
async def run_email_ingest_now(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    result = await run_email_ingest_cycle()
    return {"success": True, **result}

@router.post("/admin/verify-purchase/{purchase_id}")
async def verify_purchase(purchase_id: str, action: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    if action not in ["VERIFY", "REJECT"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    purchase = await db.purchases.get_by_id(purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    result = await _set_purchase_verification_status(
        purchase=purchase,
        action=action,
        verification_source=VerificationSource.ADMIN,
        credit_description=f"Purchase verified: {purchase.get('brand', 'Partner')} - ₹{purchase.get('amount')}",
    )
    return result

@router.post("/admin/create-partner")
async def create_partner(partner_data: PartnerCreate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    # Check if partner exists
    existing = await db.partners.find_one(contact_email=partner_data.contact_email)
    if existing:
        raise HTTPException(status_code=400, detail="Partner email already registered")

    if partner_data.password and len(partner_data.password.strip()) >= 8:
        temp_password = partner_data.password.strip()
    else:
        temp_password = generate_random_password()

    # Create partner
    partner = Partner(
        business_name=partner_data.business_name,
        category=partner_data.category,
        website=partner_data.website,
        contact_email=partner_data.contact_email,
        contact_person=partner_data.contact_person,
        password_hash=hash_password(temp_password),
        temp_password=temp_password,
        must_change_password=True,
        status=PartnerStatus.PENDING
    )

    doc = partner.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.partners.insert_one(doc)

    return {
        "success": True,
        "partner_id": partner.id,
        "email": partner_data.contact_email,
        "temp_password": temp_password,
        "message": "Partner created successfully. Share the credentials with the partner."
    }

@router.post("/admin/update-partner-status/{partner_id}")
async def update_partner_status(partner_id: str, new_status: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    if new_status not in [PartnerStatus.PENDING, PartnerStatus.PILOT, PartnerStatus.ACTIVE]:
        raise HTTPException(status_code=400, detail="Invalid status")

    await db.partners.update_one(partner_id, status=new_status)

    return {"success": True}


@router.post("/admin/partners/{partner_id}/reset-password")
async def admin_reset_partner_password(partner_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    partner = await db.partners.get_by_id(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    temp_password = generate_random_password()
    new_hash = hash_password(temp_password)
    await db.partners.update_one(
        partner_id,
        password_hash=new_hash,
        temp_password=temp_password,
        must_change_password=True,
    )
    return {"success": True, "temp_password": temp_password, "message": "Password reset. Share the temporary password with the partner."}


@router.post("/admin/partners/{partner_id}/return-window")
async def set_partner_return_window(partner_id: str, request: Request, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    partner = await db.partners.get_by_id(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    body = await request.json()
    days = int(body.get("days", 0))
    if days < 0:
        raise HTTPException(status_code=400, detail="days must be >= 0")
    await db.partners.update_one(partner_id, return_window_days=days)
    return {"success": True, "return_window_days": days}


@router.post("/admin/process-pending-credits")
async def admin_process_pending_credits(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    from app.services.business_logic import process_pending_credits
    result = await process_pending_credits()
    return {"success": True, **result}


@router.get("/admin/coupon-requests")
async def admin_list_coupon_requests(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    requests = await db.partner_coupon_requests.find_all()
    partner_ids = sorted({r.get("partner_id") for r in requests if r.get("partner_id")})
    partners = await db.partners.find_by_ids(partner_ids, fields=["id", "business_name"])
    partner_map = {p["id"]: p for p in partners}
    for r in requests:
        r["partner_name"] = partner_map.get(r.get("partner_id"), {}).get("business_name")
        if r.get("expiry_date") and hasattr(r["expiry_date"], "isoformat"):
            r["expiry_date"] = r["expiry_date"].isoformat()
        if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
            r["created_at"] = r["created_at"].isoformat()
        if r.get("reviewed_at") and hasattr(r["reviewed_at"], "isoformat"):
            r["reviewed_at"] = r["reviewed_at"].isoformat()
    return requests


@router.patch("/admin/coupon-requests/{request_id}")
async def admin_update_coupon_request(
    request_id: str, payload: PartnerCouponRequestUpdate, user: User = Depends(get_current_user)
):
    await require_role(user, UserRole.ADMIN)
    req = await db.partner_coupon_requests.get_by_id(request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.get("status") != PartnerCouponRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be updated")

    updates = payload.model_dump(exclude_unset=True)
    new_status = updates.get("status")

    if new_status == PartnerCouponRequestStatus.REJECTED:
        updates["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        updates["reviewed_by"] = user.id
        await db.partner_coupon_requests.update_one(request_id, **updates)
        return {"success": True, "message": "Request rejected"}

    if new_status == PartnerCouponRequestStatus.APPROVED:
        partner_id = req.get("partner_id")
        partner = await db.partners.get_by_id(partner_id)
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
        coupon_code = updates.get("coupon_code") or req.get("coupon_code") or f"LYNKR-{uuid.uuid4().hex[:8].upper()}"
        value_type = updates.get("value_type") or req.get("value_type") or "fixed"
        value = updates.get("value") if updates.get("value") is not None else req.get("value", 0)
        if value <= 0 and value_type == "fixed":
            value = 100
        expiry = req.get("expiry_date")
        if isinstance(expiry, str):
            exp_dt = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
        elif hasattr(expiry, "isoformat"):
            exp_dt = expiry
        else:
            raise HTTPException(status_code=400, detail="Invalid expiry_date on request")
        points_cost = updates.get("points_required") or req.get("points_required")
        total_quantity = updates.get("max_redemptions") or req.get("max_redemptions")
        coupon = Coupon(
            partner_id=partner_id,
            title=updates.get("title") or req.get("title"),
            description=updates.get("description") or req.get("description"),
            coupon_code=coupon_code,
            value_type=value_type,
            value=float(value),
            min_purchase=None,
            points_cost=points_cost,
            expiry_date=exp_dt,
            total_quantity=total_quantity,
            is_active=True,
        )
        cdoc = coupon.model_dump()
        cdoc["created_at"] = cdoc["created_at"].isoformat()
        cdoc["expiry_date"] = coupon.expiry_date.isoformat()
        await db.coupons.insert_one(cdoc)
        updates["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        updates["reviewed_by"] = user.id
        updates["status"] = PartnerCouponRequestStatus.APPROVED
        await db.partner_coupon_requests.update_one(request_id, **updates)
        return {"success": True, "message": "Request approved and coupon created", "coupon_id": coupon.id}
    updates.pop("status", None)
    if updates.get("expiry_date") and hasattr(updates["expiry_date"], "isoformat"):
        updates["expiry_date"] = updates["expiry_date"].isoformat()
    if updates:
        await db.partner_coupon_requests.update_one(request_id, **updates)
    return {"success": True}


# ---------------------------------------------------------------------------
# Manual purchase creation
# ---------------------------------------------------------------------------
@router.post("/admin/create-purchase")
async def admin_create_purchase(request: Request, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    body = await request.json()
    user_id = body.get("user_id", "").strip()
    partner_id = body.get("partner_id", "").strip()
    order_id = body.get("order_id", "").strip()
    amount = float(body.get("amount", 0))
    if not user_id or not order_id or amount <= 0:
        raise HTTPException(status_code=400, detail="user_id, order_id and amount > 0 are required")
    target_user = await db.users.get_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    partner = await db.partners.get_by_id(partner_id) if partner_id else None
    brand = partner.get("business_name", "Manual") if partner else body.get("brand", "Manual")
    purchase = Purchase(
        user_id=user_id,
        brand=brand,
        partner_id=partner_id or None,
        order_id=order_id,
        amount=amount,
        status=PurchaseStatus.PENDING,
        source="ADMIN_MANUAL",
        category=body.get("category"),
    )
    doc = purchase.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    doc["detected_at"] = doc["detected_at"].isoformat()
    await db.purchases.insert_one(doc)
    return {"success": True, "purchase_id": purchase.id}


# ---------------------------------------------------------------------------
# User detail (purchases, points ledger, redemptions)
# ---------------------------------------------------------------------------
@router.get("/admin/users/{user_id}/detail")
async def admin_user_detail(user_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    target = await db.users.get_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.pop("password_hash", None)
    purchases = await db.purchases.find_by_user(user_id, limit=500)
    ledger = await db.points_ledger.find_by_user(user_id, limit=200)
    redemptions = await db.redemptions.find_by_user(user_id, limit=200)
    return {"user": target, "purchases": purchases, "ledger": ledger, "redemptions": redemptions}


# ---------------------------------------------------------------------------
# Partner detail (orders, purchases, revenue)
# ---------------------------------------------------------------------------
@router.get("/admin/partners/{partner_id}/detail")
async def admin_partner_detail(partner_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    partner = await db.partners.get_by_id(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    partner.pop("password_hash", None)
    purchases = await db.purchases.find_by_partner(partner_id, limit=1000)
    total_revenue = sum(float(p.get("amount", 0)) for p in purchases if p.get("status") == "VERIFIED")
    return {"partner": partner, "purchases": purchases, "total_revenue": total_revenue}


# ---------------------------------------------------------------------------
# Global search across users, partners, purchases
# ---------------------------------------------------------------------------
@router.get("/admin/search")
async def admin_global_search(q: str = "", user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    q = (q or "").strip().lower()
    if len(q) < 2:
        return {"users": [], "partners": [], "purchases": []}
    all_users = await db.users.find_by_role(UserRole.USER, exclude_fields={"password_hash"})
    matched_users = [u for u in all_users if q in (u.get("username") or "").lower() or q in (u.get("email") or "").lower() or q in (u.get("full_name") or "").lower()][:20]
    all_partners = await db.partners.find_all(exclude_fields={"password_hash"})
    matched_partners = [p for p in all_partners if q in (p.get("business_name") or "").lower() or q in (p.get("contact_email") or "").lower()][:20]
    all_purchases = await db.purchases.find_all(limit=5000)
    matched_purchases = [p for p in all_purchases if q in (p.get("order_id") or "").lower() or q in (p.get("brand") or "").lower() or q in p.get("id", "").lower()][:20]
    return {"users": matched_users, "partners": matched_partners, "purchases": matched_purchases}


# ---------------------------------------------------------------------------
# Activity feed (recent purchases + redemptions)
# ---------------------------------------------------------------------------
@router.get("/admin/activity-feed")
async def admin_activity_feed(limit: int = 50, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    limit = max(1, min(limit, 200))
    purchases = await db.purchases.find_all(limit=limit, sort_desc=True)
    redemptions = await db.redemptions.find_recent(limit=limit)
    return {"purchases": purchases, "redemptions": redemptions}


# ---------------------------------------------------------------------------
# All redemptions
# ---------------------------------------------------------------------------
@router.get("/admin/redemptions")
async def admin_all_redemptions(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    redemptions = await db.redemptions.find_recent(limit=500)
    return redemptions


# ---------------------------------------------------------------------------
# Update purchase status (admin override)
# ---------------------------------------------------------------------------
@router.patch("/admin/purchases/{purchase_id}/status")
async def admin_update_purchase_status(purchase_id: str, request: Request, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    body = await request.json()
    new_status = body.get("status", "").strip()
    if new_status not in {"PENDING", "VERIFIED", "REJECTED", "FLAGGED"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    purchase = await db.purchases.get_by_id(purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    await db.purchases.update_one(purchase_id, status=new_status)
    return {"success": True, "new_status": new_status}

