"""Coupons admin/user and generic points redeem."""
from __future__ import annotations

import uuid as _uuid
from pathlib import Path as _Path

from fastapi import APIRouter, File, UploadFile

from app.api.route_support import *  # noqa: F403
from app.core.config import UPLOADS_DIR, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE

router = APIRouter(tags=['coupons'])

_COUPON_LOGOS_DIR = UPLOADS_DIR.parent / "coupon_logos"
_COUPON_LOGOS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/admin/coupons")
async def create_coupon(coupon_data: CouponCreate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    payload = coupon_data.model_dump()
    _validate_coupon_payload(payload)

    partner = await db.partners.get_by_id(payload["partner_id"])
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    if await db.coupons.code_exists(payload["coupon_code"]):
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(**payload)
    doc = coupon.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["expiry_date"] = coupon.expiry_date.isoformat()
    await db.coupons.insert_one(doc)
    return {"success": True, "coupon": doc}


@router.get("/admin/coupons")
async def get_admin_coupons(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    coupons = await db.coupons.find_all()
    hydrated = await _hydrate_coupon_partners(coupons)
    return hydrated


@router.patch("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon_update: CouponUpdate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    updates = coupon_update.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    _validate_coupon_payload(updates)

    if updates.get("partner_id"):
        partner = await db.partners.get_by_id(updates["partner_id"])
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")

    if updates.get("coupon_code"):
        if await db.coupons.code_exists(updates["coupon_code"], exclude_id=coupon_id):
            raise HTTPException(status_code=400, detail="Coupon code already exists")

    if updates.get("expiry_date"):
        updates["expiry_date"] = updates["expiry_date"].isoformat()

    if updates.get("total_quantity") is not None:
        current = await db.coupons.get_by_id(coupon_id)
        if not current:
            raise HTTPException(status_code=404, detail="Coupon not found")
        if updates["total_quantity"] < int(current.get("redeemed_count", 0)):
            raise HTTPException(status_code=400, detail="total_quantity cannot be lower than redeemed_count")

    result = await db.coupons.update_one(coupon_id, **updates)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")

    coupon = await db.coupons.get_by_id(coupon_id)
    hydrated = await _hydrate_coupon_partners([coupon])
    return {"success": True, "coupon": hydrated[0]}


@router.post("/admin/coupons/upload-logo")
async def upload_coupon_brand_logo(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are allowed")
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")
    ext = (file.filename or "logo.png").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        ext = "png"
    filename = f"coupon_{_uuid.uuid4().hex[:12]}.{ext}"
    (_COUPON_LOGOS_DIR / filename).write_bytes(contents)
    return {"url": f"/api/uploads/coupon_logos/{filename}", "filename": filename}


@router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    result = await db.coupons.delete_one(coupon_id)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"success": True}


@router.get("/coupons")
async def get_available_coupons(user: User = Depends(get_current_user)):
    coupons = await db.coupons.find_active_available()
    hydrated = await _hydrate_coupon_partners(coupons)
    return hydrated


@router.get("/coupons/redemptions")
async def get_user_coupon_redemptions(user: User = Depends(get_current_user)):
    redemptions = await db.redemptions.find_by_user(user.id)

    if not redemptions:
        return []

    coupon_ids = sorted({r.get("coupon_id") for r in redemptions if r.get("coupon_id")})
    coupons = await db.coupons.find_by_ids(coupon_ids)
    coupon_map = {c["id"]: c for c in coupons}

    partner_ids = sorted({c.get("partner_id") for c in coupons if c.get("partner_id")})
    partners = await db.partners.find_by_ids(partner_ids)
    partner_map = {p["id"]: p for p in partners}

    result = []
    for redemption in redemptions:
        coupon = coupon_map.get(redemption.get("coupon_id"), {})
        partner = partner_map.get(coupon.get("partner_id"), {})
        result.append({
            **redemption,
            "coupon_title": coupon.get("title"),
            "partner_name": partner.get("business_name"),
            "value_type": coupon.get("value_type"),
            "value": coupon.get("value"),
        })
    return result


@router.post("/coupons/{coupon_id}/redeem")
async def redeem_coupon(coupon_id: str, user: User = Depends(get_current_user)):
    coupon = await db.coupons.atomic_redeem(coupon_id)
    if not coupon:
        raise HTTPException(status_code=400, detail="Coupon unavailable, expired, or out of stock")

    user_redemption_count = await db.redemptions.count(user.id, coupon_id)
    user_limit = int(coupon.get("user_limit", 1))
    if user_redemption_count >= user_limit:
        await db.coupons.decrement_redeemed(coupon_id)
        raise HTTPException(status_code=400, detail="User redemption limit reached for this coupon")

    points_cost = int(coupon["points_cost"])
    user_data = await db.users.get_by_id(user.id)
    if not user_data or user_data.get("points", 0) < points_cost:
        await db.coupons.decrement_redeemed(coupon_id)
        raise HTTPException(status_code=400, detail="Insufficient points")
    new_points = int(user_data["points"]) - points_cost
    await db.users.update_one(user.id, points=new_points)
    updated_user = {"id": user.id, "points": new_points}

    redemption = Redemption(
        user_id=user.id,
        coupon_id=coupon_id,
        coupon_code=str(coupon.get("coupon_code", "")),
        points_deducted=points_cost,
    )
    redemption_doc = redemption.model_dump()
    redemption_doc["redeemed_at"] = redemption.redeemed_at.isoformat()
    try:
        await db.redemptions.insert_one(redemption_doc)
    except DuplicateKeyError:
        await db.coupons.decrement_redeemed(coupon_id)
        rollback_user = await db.users.get_by_id(user.id)
        await db.users.update_one(user.id, points=(rollback_user or {}).get("points", 0) + points_cost)
        raise HTTPException(status_code=400, detail="Coupon already redeemed by this user")

    ledger_entry = PointsLedger(
        user_id=user.id,
        type="COUPON_REDEMPTION",
        amount=points_cost,
        description=f"Coupon redeemed: {coupon.get('title')} ({coupon.get('coupon_code')})",
        balance_after=int(updated_user["points"]),
    )
    ledger_doc = ledger_entry.model_dump()
    ledger_doc["created_at"] = ledger_entry.created_at.isoformat()
    await db.points_ledger.insert_one(ledger_doc)

    return {
        "success": True,
        "coupon_id": coupon_id,
        "coupon_code": coupon.get("coupon_code"),
        "points_deducted": points_cost,
        "new_balance": int(updated_user["points"]),
        "remaining_quantity": max(0, int(coupon.get("total_quantity", 0)) - int(coupon.get("redeemed_count", 0))),
    }

@router.post("/points/redeem")
async def redeem_points(reward_id: str, points: int, user: User = Depends(get_current_user)):
    if user.points < points:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    # Deduct points
    new_balance = user.points - points
    await db.users.update_one(user.id, points=new_balance)
    
    # Record in ledger
    ledger_entry = PointsLedger(
        user_id=user.id,
        type="DEBIT",
        amount=points,
        description=f"Redeemed reward ID: {reward_id}",
        balance_after=new_balance
    )
    
    doc = ledger_entry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.points_ledger.insert_one(doc)
    
    # Mock coupon code
    return {
        "success": True,
        "new_balance": new_balance,
        "coupon_code": f"LYNKR-{uuid.uuid4().hex[:8].upper()}",
        "message": "Reward redeemed successfully! Check your email for the coupon code."
    }
