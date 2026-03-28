"""Public partner directory."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['partners'])

@router.get("/partners/public")
async def get_active_partners_public():
    """Marketing / partner landing: same partner list as /partners/active without requiring a USER session."""
    partners = await db.partners.find_by_statuses(
        [PartnerStatus.ACTIVE, PartnerStatus.PILOT, PartnerStatus.PENDING],
        fields=["id", "business_name", "category", "status", "catalog_slug", "website", "logo"],
    )
    for p in partners:
        if not p.get("catalog_slug"):
            pid = (p.get("id") or "")[:8]
            p["catalog_slug"] = _slugify(p.get("business_name") or "") or pid
    return partners


@router.get("/partners/active")
async def get_active_partners_for_users(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.USER)
    partners = await db.partners.find_by_statuses(
        [PartnerStatus.ACTIVE, PartnerStatus.PILOT, PartnerStatus.PENDING],
        fields=["id", "business_name", "category", "status", "catalog_slug", "website", "logo"],
    )
    for p in partners:
        if not p.get("catalog_slug"):
            pid = (p.get("id") or "")[:8]
            p["catalog_slug"] = _slugify(p.get("business_name") or "") or pid
    return partners
