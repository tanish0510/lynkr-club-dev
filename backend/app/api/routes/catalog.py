"""Public catalog."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['catalog'])

@router.get("/catalog/public/{slug}")
async def get_public_catalog(slug: str):
    slug = (slug or "").strip()
    if not slug:
        raise HTTPException(status_code=404, detail="Catalog not found")
    partner = await db.partners.get_by_id(slug)
    if not partner:
        partner = await db.partners.find_by_slug(slug)
    if not partner:
        slug_lower = slug.lower()
        for p in await db.partners.find_all(limit=5000):
            if _slugify(p.get("business_name") or "") == slug_lower:
                partner = p
                break
    if not partner:
        raise HTTPException(status_code=404, detail="Catalog not found")
    partner_id = partner["id"]
    products = await db.catalog_products.find_by_partner(partner_id, active_only=True, limit=500)
    for p in products:
        if p.get("created_at") and hasattr(p["created_at"], "isoformat"):
            p["created_at"] = p["created_at"].isoformat()
    return {
        "partner": {"id": partner["id"], "business_name": partner.get("business_name") or "Partner", "logo": partner.get("logo"), "return_window_days": partner.get("return_window_days") or 0},
        "products": products,
    }
