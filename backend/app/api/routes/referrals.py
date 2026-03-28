"""Referral system endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=["referrals"])

INVITER_REWARD = 100
INVITEE_REWARD = 50


def _generate_referral_code(username: str) -> str:
    prefix = (username or "USER")[:4].upper()
    return f"{prefix}-LYNK"


async def _ensure_unique_referral_code(base_code: str) -> str:
    """Append a counter if the code is already taken."""
    code = base_code
    counter = 1
    while await db.users.referral_code_exists(code):
        code = f"{base_code}{counter}"
        counter += 1
    return code


@router.get("/referral/my-code")
async def get_my_referral_code(user: User = Depends(get_current_user)):
    """Return the user's referral code, generating one if missing."""
    user_doc = await db.users.get_by_id(user.id)
    code = user_doc.get("referral_code")
    if not code:
        base = _generate_referral_code(user_doc.get("username", ""))
        code = await _ensure_unique_referral_code(base)
        await db.users.update_one(user.id, referral_code=code)
    return {"referral_code": code}


@router.get("/referral/stats")
async def get_referral_stats(user: User = Depends(get_current_user)):
    user_doc = await db.users.get_by_id(user.id)
    code = user_doc.get("referral_code")
    if not code:
        base = _generate_referral_code(user_doc.get("username", ""))
        code = await _ensure_unique_referral_code(base)
        await db.users.update_one(user.id, referral_code=code)

    txns = await db.referrals.find_by_inviter(user.id)
    total_earned = await db.referrals.sum_points_by_inviter(user.id)

    invites = []
    for t in txns:
        invitee = await db.users.get_by_id(t["invitee_id"])
        invites.append({
            "invitee_id": t["invitee_id"],
            "invitee_name": invitee.get("full_name", "User") if invitee else "User",
            "signed_up": True,
            "first_purchase_done": invitee.get("has_made_first_purchase", False) if invitee else False,
            "reward_earned": t.get("reward_given", False),
            "created_at": t.get("created_at"),
        })

    pending = sum(1 for i in invites if not i["first_purchase_done"])

    return {
        "referral_code": code,
        "total_invites": len(txns),
        "total_earned": total_earned,
        "pending_rewards": pending,
        "invites": invites,
    }


@router.post("/referral/apply")
async def apply_referral_code(body: ReferralApplyRequest, user: User = Depends(get_current_user)):
    """Apply a referral code to the current user (post-signup or during onboarding)."""
    code = body.referral_code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Referral code is required")

    user_doc = await db.users.get_by_id(user.id)
    if user_doc.get("referred_by"):
        raise HTTPException(status_code=400, detail="You have already used a referral code")

    inviter = await db.users.get_by_referral_code(code)
    if not inviter:
        raise HTTPException(status_code=404, detail="Invalid referral code")

    if inviter["id"] == user.id:
        raise HTTPException(status_code=400, detail="You cannot refer yourself")

    existing = await db.referrals.get_by_invitee(user.id)
    if existing:
        raise HTTPException(status_code=400, detail="Referral already applied")

    await db.users.update_one(user.id, referred_by=inviter["id"])
    await db.referrals.insert_one({
        "inviter_id": inviter["id"],
        "invitee_id": user.id,
        "reward_given": False,
    })

    return {"success": True, "message": "Referral code applied! You'll earn bonus points on your first purchase."}
