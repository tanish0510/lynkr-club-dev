"""Partner portal."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['partner'])

@router.post("/partner/auth/login")
async def partner_email_password_login(request: Request, login_data: UserLogin):
    ip = _get_client_ip(request)
    normalized_email = normalize_email(str(login_data.email))
    if await brute_force_storage.is_locked(ip, normalized_email):
        log_security_event("PARTNER_LOGIN_LOCKED", request, f"lock_duration_min={BRUTE_FORCE_LOCK_MINUTES}")
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Please try again later.",
        )

    partner = await db.partners.get_by_contact_email_ci(normalized_email)
    if not partner or not verify_password(login_data.password, partner.get("password_hash") or ""):
        await brute_force_storage.record_failure(ip, normalized_email)
        log_security_event("PARTNER_LOGIN_FAILED", request, "invalid_credentials")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await brute_force_storage.clear_on_success(ip, normalized_email)

    token = create_access_token({"sub": partner["id"], "role": "PARTNER"})

    return {
        "token": token,
        "user": {
            "id": partner["id"],
            "email": partner["contact_email"],
            "full_name": partner.get("contact_person") or partner.get("business_name", ""),
            "role": "PARTNER",
            "must_change_password": partner.get("must_change_password", False),
            "partner_id": partner["id"],
            "partner_logo": partner.get("logo"),
        }
    }

@router.post("/partner/first-login-password-change")
async def partner_first_login_password_change(new_password: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = user.id

    partner = await db.partners.get_by_id(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    if not partner.get("must_change_password"):
        raise HTTPException(status_code=400, detail="Password already changed")

    new_hash = hash_password(new_password)
    await db.partners.update_one(
        partner_id,
        password_hash=new_hash,
        must_change_password=False,
        temp_password=None,
    )

    return {"success": True, "message": "Password changed successfully"}


@router.get("/partner/settings")
async def get_partner_settings(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = user.id
    partner = await db.partners.get_by_id(partner_id, exclude_fields={"password_hash", "temp_password"})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    return {
        "partner": partner,
        "user": {
            "email": partner.get("contact_email", ""),
            "full_name": partner.get("contact_person", ""),
            "phone": partner.get("contact_phone", ""),
        },
        "notification_preferences": partner.get("notification_preferences", {
            "email_orders": True, "email_rewards": True, "sms_orders": False,
        }),
    }


@router.put("/partner/settings/profile")
async def update_partner_profile(request: Request, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = user.id
    body = await request.json()
    allowed = {"business_name", "category", "website", "description", "address", "contact_phone", "contact_person"}
    updates = {k: v for k, v in body.items() if k in allowed and v is not None}
    if "full_name" in body and body["full_name"] is not None:
        updates["contact_person"] = body["full_name"]
    if "phone" in body and body["phone"] is not None:
        updates["contact_phone"] = body["phone"]
    if updates:
        await db.partners.update_one(partner_id, **updates)
    return {"success": True}


@router.post("/partner/settings/change-password")
async def partner_change_password(request: Request, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    body = await request.json()
    current_password = body.get("current_password", "")
    new_password = body.get("new_password", "")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    partner = await db.partners.get_by_id(user.id)
    if not partner or not verify_password(current_password, partner.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_hash = hash_password(new_password)
    await db.partners.update_one(user.id, password_hash=new_hash)
    return {"success": True, "message": "Password changed"}


@router.put("/partner/settings/notifications")
async def update_partner_notifications(request: Request, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)
    body = await request.json()
    allowed = {"email_orders", "email_rewards", "sms_orders"}
    patch = {k: v for k, v in body.items() if k in allowed}
    if patch:
        partner = await db.partners.get_by_id(partner_id)
        base = (partner or {}).get("notification_preferences") or {
            "email_orders": True, "email_rewards": True, "sms_orders": False,
        }
        merged = {**base, **patch}
        await db.partners.update_one(partner_id, notification_preferences=merged)
    return {"success": True}


@router.get("/partner/dashboard")
async def get_partner_dashboard(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = user.id
    partner = await db.partners.get_by_id(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    # Get partner orders
    orders = await db.partner_orders.find_by_partner(partner_id)
    
    # Calculate metrics
    total_orders = len(orders)
    acknowledged_orders = len([o for o in orders if o['status'] == 'ACKNOWLEDGED'])
    pending_orders = len([o for o in orders if o['status'] == 'PENDING'])
    total_value = sum(o['amount'] for o in orders)
    
    return {
        "partner_info": partner,
        "must_change_password": partner.get('must_change_password', False),
        "metrics": {
            "total_orders": total_orders,
            "acknowledged_orders": acknowledged_orders,
            "pending_orders": pending_orders,
            "total_value": total_value
        }
    }

@router.get("/partner/orders")
async def get_partner_orders(status: Optional[str] = None, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    
    partner_id = await _get_partner_id_for_user(user.id)
    
    orders = await db.partner_orders.find_by_partner(partner_id, status=status)
    
    return [
        PartnerOrderResponse(
            id=o['id'],
            user_lynkr_email=o['user_lynkr_email'],
            order_id=o['order_id'],
            transaction_id=o.get('transaction_id'),
            amount=o['amount'],
            status=o['status'],
            created_at=o['created_at'],
            acknowledged_at=o.get('acknowledged_at')
        ) for o in orders
    ]


@router.get("/partner/purchases")
async def get_partner_purchases(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)

    purchases = await db.purchases.find_by_partner(
        partner_id, statuses=[PurchaseStatus.PENDING, PurchaseStatus.VERIFIED]
    )

    user_ids = sorted({p.get("user_id") for p in purchases if p.get("user_id")})
    user_map = {}
    if user_ids:
        users = await db.users.find_by_ids(user_ids, fields=["id", "lynkr_email"])
        user_map = {u["id"]: u for u in users}

    return [
        PartnerPurchaseItem(
            purchase_id=p["id"],
            user_lynkr_email=user_map.get(p.get("user_id"), {}).get("lynkr_email", ""),
            order_id=p.get("order_id"),
            transaction_id=p.get("transaction_id"),
            amount=float(p.get("amount", 0)),
            status=p.get("status"),
            created_at=p.get("timestamp"),
        ).model_dump()
        for p in purchases
    ]


@router.post("/partner/verify-purchase")
async def partner_verify_purchase(payload: PartnerVerifyPurchaseRequest, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)

    action = (payload.action or "").strip().upper()
    if action not in {"VERIFY", "REJECT"}:
        raise HTTPException(status_code=400, detail="action must be VERIFY or REJECT")

    purchase = await db.purchases.get_by_id(payload.purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    if purchase.get("partner_id") != partner_id:
        raise HTTPException(status_code=403, detail="You can only verify your own purchases")

    partner = await db.partners.get_by_id(partner_id)
    partner_name = partner.get("business_name", "Partner") if partner else "Partner"
    result = await _set_purchase_verification_status(
        purchase=purchase,
        action=action,
        verification_source=VerificationSource.PARTNER,
        credit_description=f"Partner verified purchase: {partner_name}",
    )

    order_status = "ACKNOWLEDGED" if action == "VERIFY" else "DISPUTED"
    await db.partner_orders.update_by_filter(
        {"purchase_id": payload.purchase_id, "partner_id": partner_id},
        status=order_status,
        acknowledged_at=datetime.now(timezone.utc).isoformat(),
    )
    return result

@router.post("/partner/acknowledge-order/{order_id}")
async def acknowledge_order(order_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    
    partner_id = await _get_partner_id_for_user(user.id)
    
    # Verify order belongs to this partner
    order = await db.partner_orders.find_by_partner_and_id(order_id, partner_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['status'] != 'PENDING':
        raise HTTPException(status_code=400, detail="Order already processed")
    
    # Acknowledge order
    await db.partner_orders.update_one(
        order_id,
        status="ACKNOWLEDGED",
        acknowledged_at=datetime.now(timezone.utc).isoformat(),
    )
    
    purchase = await db.purchases.get_by_id(order['purchase_id'])
    partner = await db.partners.get_by_id(partner_id)
    partner_name = partner.get("business_name", purchase.get("brand", "Partner")) if partner else purchase.get("brand", "Partner")
    await _set_purchase_verification_status(
        purchase=purchase,
        action="VERIFY",
        verification_source=VerificationSource.PARTNER,
        credit_description=f"Partner verified purchase: {partner_name}",
    )

    return {"success": True, "message": "Order acknowledged and points credited"}


@router.post("/partner/coupon-requests")
async def create_partner_coupon_request(
    payload: PartnerCouponRequestCreate, user: User = Depends(get_current_user)
):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)

    now = datetime.now(timezone.utc)
    if payload.expiry_date and payload.expiry_date <= now:
        raise HTTPException(status_code=400, detail="expiry_date must be in the future")
    if payload.points_required <= 0:
        raise HTTPException(status_code=400, detail="points_required must be > 0")
    if payload.max_redemptions <= 0:
        raise HTTPException(status_code=400, detail="max_redemptions must be > 0")

    req = PartnerCouponRequest(
        partner_id=partner_id,
        title=payload.title,
        description=payload.description,
        discount_or_reward_details=payload.discount_or_reward_details or "",
        points_required=payload.points_required,
        expiry_date=payload.expiry_date,
        max_redemptions=payload.max_redemptions,
        terms_and_conditions=payload.terms_and_conditions or "",
        status=PartnerCouponRequestStatus.PENDING,
    )
    doc = req.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["expiry_date"] = req.expiry_date.isoformat()
    await db.partner_coupon_requests.insert_one(doc)
    return {"success": True, "request": doc}


@router.get("/partner/coupon-requests")
async def list_partner_coupon_requests(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)
    requests = await db.partner_coupon_requests.find_by_partner(partner_id)
    for r in requests:
        if r.get("expiry_date") and hasattr(r["expiry_date"], "isoformat"):
            r["expiry_date"] = r["expiry_date"].isoformat()
        if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
            r["created_at"] = r["created_at"].isoformat()
        if r.get("reviewed_at") and hasattr(r["reviewed_at"], "isoformat"):
            r["reviewed_at"] = r["reviewed_at"].isoformat()
    return requests


# ============ PARTNER CATALOG ============

def _slugify(s: str) -> str:
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "catalog"


@router.get("/partner/catalog/overview")
async def get_partner_catalog_overview(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)
    partner = await db.partners.get_by_id(partner_id)
    slug = (partner.get("catalog_slug") or "").strip() or _slugify(partner.get("business_name") or "") or partner_id[:8]
    if not slug:
        slug = partner_id[:8]
    products = await db.catalog_products.find_by_partner(partner_id)
    total = len(products)
    active = len([p for p in products if p.get("active", True)])
    categories = sorted({(p.get("category") or "").strip() for p in products if (p.get("category") or "").strip()})
    frontend_origin = FRONTEND_URL.rstrip("/")
    share_link = f"{frontend_origin}/catalog/{slug}"
    return {
        "total_products": total,
        "active_products": active,
        "categories_count": len(categories),
        "share_link": share_link,
        "catalog_slug": slug,
        "logo": partner.get("logo"),
    }


@router.get("/partner/catalog/products")
async def list_partner_catalog_products(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)
    products = await db.catalog_products.find_by_partner(partner_id, limit=500)
    for p in products:
        if p.get("created_at") and hasattr(p["created_at"], "isoformat"):
            p["created_at"] = p["created_at"].isoformat()
    return products


@router.post("/partner/catalog/products")
async def create_partner_catalog_product(payload: CatalogProductCreate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)
    product = CatalogProduct(
        partner_id=partner_id,
        name=payload.name,
        description=payload.description or "",
        price=float(payload.price or 0),
        category=(payload.category or "").strip(),
        images=payload.images or [],
        whatsapp_order_link=(payload.whatsapp_order_link or "").strip(),
        discount=payload.discount,
        tags=payload.tags or [],
        active=payload.active,
    )
    doc = product.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.catalog_products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/partner/catalog/products/{product_id}")
async def get_partner_catalog_product(product_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)
    product = await db.catalog_products.find_one(id=product_id, partner_id=partner_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.get("created_at") and hasattr(product["created_at"], "isoformat"):
        product["created_at"] = product["created_at"].isoformat()
    return product


@router.put("/partner/catalog/products/{product_id}")
async def update_partner_catalog_product(product_id: str, payload: CatalogProductUpdate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)
    product = await db.catalog_products.find_one(id=product_id, partner_id=partner_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        if product.get("created_at") and hasattr(product["created_at"], "isoformat"):
            product["created_at"] = product["created_at"].isoformat()
        return product
    await db.catalog_products.update_one(product_id, partner_id, **updates)
    updated = await db.catalog_products.find_one(id=product_id, partner_id=partner_id)
    if updated.get("created_at") and hasattr(updated["created_at"], "isoformat"):
        updated["created_at"] = updated["created_at"].isoformat()
    return updated


@router.delete("/partner/catalog/products/{product_id}")
async def delete_partner_catalog_product(product_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)
    result = await db.catalog_products.delete_one(product_id, partner_id)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}


@router.post("/partner/catalog/upload-image")
async def upload_catalog_image(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are allowed")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        ext = "jpg"

    filename = f"{partner_id}_{uuid.uuid4().hex[:12]}.{ext}"
    filepath = UPLOADS_DIR / filename
    filepath.write_bytes(contents)

    image_url = f"/api/uploads/catalog/{filename}"
    return {"url": image_url, "filename": filename}


@router.post("/partner/logo/upload")
async def upload_partner_logo(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are allowed")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        ext = "jpg"

    filename = f"logo_{partner_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = UPLOADS_DIR / filename
    filepath.write_bytes(contents)

    logo_url = f"/api/uploads/catalog/{filename}"
    try:
        extracted = _extract_palette_from_bytes(contents, 6)
    except Exception:
        extracted = []
    await db.partners.update_one(partner_id, logo=logo_url, extracted_palette=extracted)
    return {"url": logo_url, "filename": filename, "palette": extracted}


@router.delete("/partner/logo")
async def delete_partner_logo(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)
    await db.partners.update_one(partner_id, logo=None)
    return {"ok": True}

