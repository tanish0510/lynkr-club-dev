"""Points ledger and leaderboard."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['points'])

@router.get("/points/ledger")
async def get_points_ledger(user: User = Depends(get_current_user)):
    ledger = await db.points_ledger.find_by_user(user.id)
    
    return ledger


@router.get("/points/leaderboard")
async def get_points_leaderboard(user: User = Depends(get_current_user)):
    top_users = await db.users.top_by_points(
        UserRole.USER,
        limit=20,
        fields=["id", "full_name", "email", "username", "avatar", "points"],
    )

    if not top_users:
        return []

    user_ids = [u["id"] for u in top_users]
    redemption_map = await db.redemptions.count_by_users(user_ids)

    ledger_map = await db.points_ledger.latest_per_user(user_ids)

    leaderboard = []
    for idx, u in enumerate(top_users, start=1):
        last_entry = ledger_map.get(u["id"], {})
        leaderboard.append({
            "rank": idx,
            "user_id": u["id"],
            "username": u.get("username") or _mask_username(u.get("full_name"), u.get("email"), u["id"]),
            "avatar": u.get("avatar") or DEFAULT_AVATAR,
            "masked_username": _mask_username(u.get("full_name"), u.get("email"), u["id"]),
            "points": int(u.get("points", 0)),
            "coupons_redeemed": redemption_map.get(u["id"], 0),
            "last_activity": {
                "type": last_entry.get("type"),
                "description": last_entry.get("description"),
                "created_at": last_entry.get("created_at"),
            } if last_entry else None,
        })

    return leaderboard


@router.get("/community/redemptions")
async def get_recent_community_redemptions(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.USER)
    redemptions = await db.redemptions.find_recent(limit=30)
    if not redemptions:
        return []

    user_ids = sorted({item.get("user_id") for item in redemptions if item.get("user_id")})
    coupon_ids = sorted({item.get("coupon_id") for item in redemptions if item.get("coupon_id")})
    users = await db.users.find_by_ids(
        user_ids,
        fields=["id", "username", "avatar", "points"],
    )
    coupons = await db.coupons.find_by_ids(coupon_ids)

    user_map = {u["id"]: u for u in users}
    coupon_map = {c["id"]: c for c in coupons}
    partner_ids = sorted({c.get("partner_id") for c in coupons if c.get("partner_id")})
    partner_map = {}
    if partner_ids:
        partners = await db.partners.find_by_ids(partner_ids, fields=["id", "business_name"])
        partner_map = {p["id"]: p for p in partners}

    result = []
    for redemption in redemptions:
        redemption_user = user_map.get(redemption.get("user_id"), {})
        coupon = coupon_map.get(redemption.get("coupon_id"), {})
        partner = partner_map.get(coupon.get("partner_id"), {})
        result.append({
            "id": redemption.get("id"),
            "username": redemption_user.get("username", "lynkr_user"),
            "avatar": redemption_user.get("avatar", DEFAULT_AVATAR),
            "points": int(redemption_user.get("points", 0)),
            "coupon_title": coupon.get("title"),
            "partner_name": partner.get("business_name"),
            "redeemed_at": redemption.get("redeemed_at"),
        })

    return result
