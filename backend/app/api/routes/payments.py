"""Purchases."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['payments'])

# ============ PURCHASES ENDPOINTS ============

@router.post("/purchases", response_model=PurchaseResponse)
async def create_purchase(purchase_data: PurchaseCreate, user: User = Depends(get_current_user)):
    purchase = Purchase(
        user_id=user.id,
        brand=purchase_data.brand,
        order_id=purchase_data.order_id,
        amount=purchase_data.amount,
        status=PurchaseStatus.PENDING
    )
    
    doc = purchase.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    doc['detected_at'] = doc['detected_at'].isoformat()
    await db.purchases.insert_one(doc)
    
    return PurchaseResponse(
        id=purchase.id,
        brand=purchase.brand,
        order_id=purchase.order_id,
        transaction_id=purchase.transaction_id,
        amount=purchase.amount,
        status=purchase.status,
        category=purchase.category,
        timestamp=purchase.timestamp.isoformat()
    )


@router.post("/user/raise-purchase")
async def raise_purchase(payload: RaisePurchaseRequest, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.USER)

    partner_id = (payload.partner_id or "").strip()
    order_id = (payload.order_id or "").strip()
    transaction_id = (payload.transaction_id or "").strip()
    if not partner_id:
        raise HTTPException(status_code=400, detail="partner_id is required")
    if not order_id:
        raise HTTPException(status_code=400, detail="order_id is required")
    if not transaction_id:
        raise HTTPException(status_code=400, detail="transaction_id is required")
    if float(payload.amount) <= 0:
        raise HTTPException(status_code=400, detail="amount must be > 0")

    partner = await db.partners.get_by_id(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    purchase = Purchase(
        user_id=user.id,
        partner_id=partner_id,
        brand=partner.get("business_name", "Partner Purchase"),
        order_id=order_id,
        transaction_id=transaction_id,
        amount=float(payload.amount),
        status=PurchaseStatus.PENDING,
        submitted_by_user=True,
    )
    purchase_doc = purchase.model_dump()
    purchase_doc["timestamp"] = purchase.timestamp.isoformat()
    purchase_doc["detected_at"] = purchase.detected_at.isoformat()
    await db.purchases.insert_one(purchase_doc)

    partner_order = PartnerOrder(
        partner_id=partner_id,
        purchase_id=purchase.id,
        user_lynkr_email=user.lynkr_email,
        order_id=order_id,
        transaction_id=transaction_id,
        amount=float(payload.amount),
        status="PENDING",
    )
    partner_doc = partner_order.model_dump()
    partner_doc["created_at"] = partner_order.created_at.isoformat()
    await db.partner_orders.insert_one(partner_doc)

    return {
        "success": True,
        "purchase_id": purchase.id,
        "status": purchase.status,
        "partner_name": partner.get("business_name"),
    }

@router.get("/purchases")
async def get_purchases(user: User = Depends(get_current_user)):
    purchases = await db.purchases.find_by_user(user.id)
    
    return [
        PurchaseResponse(
            id=p['id'],
            brand=p['brand'],
            order_id=p['order_id'],
            transaction_id=p.get('transaction_id'),
            amount=p['amount'],
            status=p['status'],
            category=p.get('category'),
            timestamp=p['timestamp']
        ) for p in purchases
    ]


@router.get("/user/raised-purchases")
async def get_raised_purchases(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.USER)
    purchases = await db.purchases.find_by_user_submitted(user.id)

    partner_ids = sorted({p.get("partner_id") for p in purchases if p.get("partner_id")})
    partner_map = {}
    if partner_ids:
        partners = await db.partners.find_by_ids(partner_ids, fields=["id", "business_name"])
        partner_map = {p["id"]: p for p in partners}

    return [
        {
            "purchase_id": p["id"],
            "partner_id": p.get("partner_id"),
            "partner_name": partner_map.get(p.get("partner_id"), {}).get("business_name"),
            "order_id": p.get("order_id"),
            "transaction_id": p.get("transaction_id"),
            "amount": p.get("amount"),
            "status": p.get("status"),
            "created_at": p.get("timestamp"),
            "edited_once": bool(p.get("edited_once", False)),
            "can_edit": p.get("status") == PurchaseStatus.PENDING and not bool(p.get("edited_once", False)),
        }
        for p in purchases
    ]


@router.patch("/user/raised-purchases/{purchase_id}")
async def update_raised_purchase(
    purchase_id: str,
    payload: UserPurchaseUpdateRequest,
    user: User = Depends(get_current_user),
):
    await require_role(user, UserRole.USER)
    purchase = await db.purchases.find_by_user_and_id(purchase_id, user.id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    if not purchase.get("submitted_by_user"):
        raise HTTPException(status_code=400, detail="Only manually raised purchases can be edited")
    if purchase.get("status") != PurchaseStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending purchases can be edited")
    if purchase.get("edited_once", False):
        raise HTTPException(status_code=400, detail="Purchase can only be edited once")

    patch_data: Dict[str, Any] = {}
    partner_name: Optional[str] = None

    if payload.partner_id is not None:
        new_partner_id = payload.partner_id.strip()
        if not new_partner_id:
            raise HTTPException(status_code=400, detail="partner_id cannot be empty")
        partner = await db.partners.get_by_id(new_partner_id)
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
        patch_data["partner_id"] = new_partner_id
        patch_data["brand"] = partner.get("business_name", purchase.get("brand"))
        partner_name = partner.get("business_name")

    if payload.order_id is not None:
        new_order_id = payload.order_id.strip()
        if not new_order_id:
            raise HTTPException(status_code=400, detail="order_id cannot be empty")
        patch_data["order_id"] = new_order_id

    if payload.transaction_id is not None:
        new_transaction_id = payload.transaction_id.strip()
        if not new_transaction_id:
            raise HTTPException(status_code=400, detail="transaction_id cannot be empty")
        patch_data["transaction_id"] = new_transaction_id

    if payload.amount is not None:
        if float(payload.amount) <= 0:
            raise HTTPException(status_code=400, detail="amount must be > 0")
        patch_data["amount"] = float(payload.amount)

    if not patch_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    patch_data["edited_once"] = True
    await db.purchases.update_one(purchase_id, **patch_data)

    partner_order_patch = {}
    if "partner_id" in patch_data:
        partner_order_patch["partner_id"] = patch_data["partner_id"]
    if "order_id" in patch_data:
        partner_order_patch["order_id"] = patch_data["order_id"]
    if "transaction_id" in patch_data:
        partner_order_patch["transaction_id"] = patch_data["transaction_id"]
    if "amount" in patch_data:
        partner_order_patch["amount"] = patch_data["amount"]
    if partner_order_patch:
        await db.partner_orders.update_by_filter({"purchase_id": purchase_id}, **partner_order_patch)

    return {
        "success": True,
        "purchase_id": purchase_id,
        "partner_name": partner_name,
        "edited_once": True,
    }
