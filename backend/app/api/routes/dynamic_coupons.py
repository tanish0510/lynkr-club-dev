"""Dynamic Coupons — gamified coupon system with slider, request, admin approval, and gift card delivery."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=["dynamic_coupons"])


# ============ USER ENDPOINTS ============


@router.get("/dynamic-coupons/configs")
async def get_dynamic_coupon_configs(user: User = Depends(get_current_user)):
    """Return all active brand configs sorted by min_unlock_amount (for the slider UI)."""
    configs = await db.dynamic_coupon_configs.find_active()
    return configs


@router.get("/dynamic-coupons/unlock-status")
async def get_unlock_status(user: User = Depends(get_current_user)):
    """Check unlock state and return available vs locked points breakdown."""
    unlock = await db.dynamic_coupon_unlocks.get_by_user(user.id)
    user_data = await db.users.get_by_id(user.id)
    total_points = user_data.get("points", 0) if user_data else 0
    locked_points = await db.dynamic_coupon_requests.sum_locked_points(user.id)
    available_points = max(0, total_points - locked_points)
    return {
        "is_unlocked": bool(unlock and unlock.get("is_unlocked")),
        "total_points": total_points,
        "available_points": available_points,
        "locked_points": locked_points,
        "points": total_points,
        "eligible": total_points >= 100,
    }


@router.post("/dynamic-coupons/unlock")
async def unlock_dynamic_coupons(user: User = Depends(get_current_user)):
    """Unlock the Dynamic Coupons section (requires >= 100 points, does NOT deduct)."""
    existing = await db.dynamic_coupon_unlocks.get_by_user(user.id)
    if existing and existing.get("is_unlocked"):
        return {"success": True, "message": "Already unlocked"}

    user_data = await db.users.get_by_id(user.id)
    if not user_data or user_data.get("points", 0) < 100:
        raise HTTPException(status_code=400, detail="Need at least 100 points to unlock Dynamic Coupons")

    await db.dynamic_coupon_unlocks.insert_one({
        "user_id": user.id,
        "is_unlocked": True,
        "unlocked_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"success": True, "message": "Dynamic Coupons unlocked!"}


@router.post("/dynamic-coupons/request")
async def request_dynamic_coupon(body: DynamicCouponUserRequest, user: User = Depends(get_current_user)):
    """Create a pending coupon request. Points are NOT deducted until admin approves."""
    config = await db.dynamic_coupon_configs.get_by_id(body.config_id)
    if not config or not config.get("is_active"):
        raise HTTPException(status_code=404, detail="Coupon config not found or inactive")

    if body.requested_amount < config["min_unlock_amount"]:
        raise HTTPException(status_code=400, detail=f"Minimum amount for {config['brand_name']} is ₹{config['min_unlock_amount']}")

    user_data = await db.users.get_by_id(user.id)
    if not user_data or user_data.get("points", 0) < config["points_cost"]:
        raise HTTPException(status_code=400, detail="Insufficient points")

    req_doc = {
        "user_id": user.id,
        "config_id": body.config_id,
        "brand_name": config["brand_name"],
        "requested_amount": body.requested_amount,
        "points_used": config["points_cost"],
        "status": DynamicCouponRequestStatus.PENDING,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    req_id = await db.dynamic_coupon_requests.insert_one(req_doc)
    return {"success": True, "request_id": req_id, "message": "Request submitted! Admin will review shortly."}


@router.get("/dynamic-coupons/my-requests")
async def get_my_requests(user: User = Depends(get_current_user)):
    """List the current user's dynamic coupon requests."""
    requests = await db.dynamic_coupon_requests.find_by_user(user.id)
    result = []
    for r in requests:
        item = {**r}
        if r.get("status") == DynamicCouponRequestStatus.APPROVED and r.get("gift_card_id"):
            card = await db.dynamic_coupon_inventory.get_by_id(r["gift_card_id"])
            if card:
                item["card_code"] = card["card_code"]
                item["card_pin"] = card["card_pin"]
                item["card_value"] = card["value"]
        result.append(item)
    return result


# ============ ADMIN ENDPOINTS ============


@router.post("/admin/dynamic-coupons/configs")
async def admin_create_config(body: DynamicCouponConfigCreate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    doc = body.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    config_id = await db.dynamic_coupon_configs.insert_one(doc)
    return {"success": True, "id": config_id}


@router.get("/admin/dynamic-coupons/configs")
async def admin_list_configs(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    return await db.dynamic_coupon_configs.find_all()


@router.patch("/admin/dynamic-coupons/configs/{config_id}")
async def admin_update_config(config_id: str, body: DynamicCouponConfigUpdate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.dynamic_coupon_configs.update_one(config_id, **updates)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Config not found")
    return {"success": True}


@router.delete("/admin/dynamic-coupons/configs/{config_id}")
async def admin_delete_config(config_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    result = await db.dynamic_coupon_configs.delete_one(config_id)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Config not found")
    return {"success": True}


@router.get("/admin/dynamic-coupons/requests")
async def admin_list_requests(status: Optional[str] = None, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    requests = await db.dynamic_coupon_requests.find_all(status_filter=status)
    user_ids = sorted({r.get("user_id") for r in requests if r.get("user_id")})
    if user_ids:
        users_list = []
        for uid in user_ids:
            u = await db.users.get_by_id(uid)
            if u:
                users_list.append(u)
        user_map = {u["id"]: u for u in users_list}
    else:
        user_map = {}
    for r in requests:
        u = user_map.get(r.get("user_id"), {})
        r["user_name"] = u.get("full_name", "")
        r["user_email"] = u.get("email", "")
        r["user_points"] = u.get("points", 0)
    return requests


@router.patch("/admin/dynamic-coupons/requests/{request_id}")
async def admin_approve_reject_request(
    request_id: str, body: DynamicCouponApproval, user: User = Depends(get_current_user)
):
    """Approve or reject a dynamic coupon request. On approval: deduct points + assign gift card."""
    await require_role(user, UserRole.ADMIN)
    req = await db.dynamic_coupon_requests.get_by_id(request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.get("status") != DynamicCouponRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be updated")

    new_status = body.status
    if new_status not in (DynamicCouponRequestStatus.APPROVED, DynamicCouponRequestStatus.REJECTED):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")

    if new_status == DynamicCouponRequestStatus.REJECTED:
        await db.dynamic_coupon_requests.update_one(
            request_id, status=DynamicCouponRequestStatus.REJECTED, admin_note=body.admin_note or ""
        )
        return {"success": True, "message": "Request rejected"}

    # --- APPROVAL FLOW ---
    requester = await db.users.get_by_id(req["user_id"])
    if not requester:
        raise HTTPException(status_code=404, detail="User not found")
    points_cost = req["points_used"]
    if requester.get("points", 0) < points_cost:
        raise HTTPException(status_code=400, detail=f"User only has {requester.get('points', 0)} points, needs {points_cost}")

    card = await db.dynamic_coupon_inventory.find_available(req["brand_name"])
    if not card:
        raise HTTPException(status_code=400, detail=f"No available gift cards for {req['brand_name']}")

    new_points = requester["points"] - points_cost
    await db.users.update_one(req["user_id"], points=new_points)

    await db.dynamic_coupon_inventory.update_one(
        card["id"],
        is_used=True,
        assigned_to_user_id=req["user_id"],
        assigned_at=datetime.now(timezone.utc).isoformat(),
    )

    await db.dynamic_coupon_requests.update_one(
        request_id,
        status=DynamicCouponRequestStatus.APPROVED,
        gift_card_id=card["id"],
        admin_note=body.admin_note or "",
    )

    ledger_entry = PointsLedger(
        user_id=req["user_id"],
        type="DYNAMIC_COUPON_REDEMPTION",
        amount=points_cost,
        description=f"Dynamic coupon redeemed: {req['brand_name']} (₹{req['requested_amount']})",
        balance_after=new_points,
    )
    ldoc = ledger_entry.model_dump()
    ldoc["created_at"] = ledger_entry.created_at.isoformat()
    await db.points_ledger.insert_one(ldoc)

    return {
        "success": True,
        "message": "Request approved — gift card assigned and points deducted",
        "card_value": card["value"],
        "points_deducted": points_cost,
        "new_user_balance": new_points,
    }


# ============ ADMIN INVENTORY ============


@router.post("/admin/dynamic-coupons/inventory")
async def admin_add_inventory(body: DynamicCouponInventoryCreate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    doc = body.model_dump()
    doc["is_used"] = False
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    inv_id = await db.dynamic_coupon_inventory.insert_one(doc)
    return {"success": True, "id": inv_id}


@router.get("/admin/dynamic-coupons/inventory")
async def admin_list_inventory(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    items = await db.dynamic_coupon_inventory.find_all()
    return items


@router.delete("/admin/dynamic-coupons/inventory/{inv_id}")
async def admin_delete_inventory(inv_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    result = await db.dynamic_coupon_inventory.delete_one(inv_id)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Card not found or already used")
    return {"success": True}
