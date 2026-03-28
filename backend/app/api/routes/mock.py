"""Mock ingestion."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['mock'])

@router.post("/mock/ingest-email")
async def mock_email_ingestion(
    lynkr_email: str,
    brand: str,
    order_id: str,
    amount: float
):
    """Mock endpoint to simulate email ingestion service"""
    # Find user by lynkr_email
    user = await db.users.get_by_lynkr_email(lynkr_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find partner by brand name (simplified - in real app, would be more sophisticated)
    all_partners = await db.partners.find_all()
    partner = next((p for p in all_partners if brand.lower() in (p.get("business_name") or "").lower()), None)

    # Create purchase
    purchase = Purchase(
        user_id=user['id'],
        brand=brand,
        partner_id=partner["id"] if partner else None,
        order_id=order_id,
        amount=amount,
        status=PurchaseStatus.PENDING,
        category=SpendingCategory.OTHER
    )
    
    doc = purchase.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    doc['detected_at'] = doc['detected_at'].isoformat()
    await db.purchases.insert_one(doc)
    
    if partner:
        # Create partner order
        partner_order = PartnerOrder(
            partner_id=partner['id'],
            purchase_id=purchase.id,
            user_lynkr_email=lynkr_email,
            order_id=order_id,
            transaction_id=purchase.transaction_id,
            amount=amount,
            status="PENDING"
        )
        
        partner_doc = partner_order.model_dump()
        partner_doc['created_at'] = partner_doc['created_at'].isoformat()
        await db.partner_orders.insert_one(partner_doc)
    
    return {"success": True, "purchase_id": purchase.id}
