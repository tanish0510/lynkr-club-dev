"""Shared business logic (extracted from server.py)."""
from __future__ import annotations

import asyncio
import logging
import os
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import httpx
import jwt
import resend
from fastapi import HTTPException, Request, status
from pgdoc import DuplicateKeyError

from app import state as app_state
from app.core import config as cfg
from app.core.clients import zoho_org_token_manager
from app.core.security import pwd_context
from app.db.database import db
from app.schemas.api.domain_models import (
    CouponValueType,
    PartnerOrder,
    PointsLedger,
    Purchase,
    PurchaseStatus,
    SpendingCategory,
    User,
    UserRole,
    VerificationSource,
)
from services.email_ingest_service import is_purchase_email, parse_purchase_email

JWT_SECRET = cfg.JWT_SECRET
JWT_ALGORITHM = cfg.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = cfg.ACCESS_TOKEN_EXPIRE_MINUTES
FRONTEND_URL = cfg.FRONTEND_URL
SENDER_EMAIL = cfg.SENDER_EMAIL
VERIFICATION_OTP_EXPIRE_MINUTES = cfg.VERIFICATION_OTP_EXPIRE_MINUTES
ZOHO_MAIL_ENABLED = cfg.ZOHO_MAIL_ENABLED
ZOHO_MAIL_ORG_ID = cfg.ZOHO_MAIL_ORG_ID
ZOHO_MAIL_API_BASE = cfg.ZOHO_MAIL_API_BASE
USERNAME_REGEX = cfg.USERNAME_REGEX
DEFAULT_AVATAR = cfg.DEFAULT_AVATAR
AVATAR_PATH_REGEX = cfg.AVATAR_PATH_REGEX
EMAIL_INGEST_ENABLED = cfg.EMAIL_INGEST_ENABLED
EMAIL_INGEST_BATCH_SIZE = cfg.EMAIL_INGEST_BATCH_SIZE
ZOHO_MAIL_DOMAIN = cfg.ZOHO_MAIL_DOMAIN

_ai_pipeline = None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_lynkr_email(username: str) -> str:
    return f"{username}@{ZOHO_MAIL_DOMAIN}"


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def normalize_username(username: str) -> str:
    return (username or "").strip().lower()


def is_valid_avatar(avatar: str) -> bool:
    return bool(AVATAR_PATH_REGEX.fullmatch((avatar or "").strip()))


def generate_verification_token() -> str:
    return str(uuid.uuid4())


def generate_verification_otp() -> str:
    import random
    return "".join(str(random.randint(0, 9)) for _ in range(6))

def generate_random_password(length: int = 12) -> str:
    import random
    import string
    characters = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(random.choice(characters) for _ in range(length))


async def _allocate_unique_partner_username(contact_email: str) -> str:
    base_username = normalize_username((contact_email or "").split("@")[0])
    base_username = re.sub(r"[^a-z0-9_]", "", base_username)[:16] or "partner"
    candidate = base_username
    suffix = 1
    while await db.users.username_exists(candidate):
        candidate = f"{base_username}_{suffix}"
        suffix += 1
    return candidate


async def _ensure_user_for_partner(partner: dict) -> Optional[dict]:
    """No-op — partners authenticate directly from the partners table now."""
    return None


def _split_name(full_name: str) -> tuple[str, str]:
    parts = [p for p in (full_name or "").strip().split(" ") if p]
    if not parts:
        return ("Lynkr", "User")
    if len(parts) == 1:
        return (parts[0], "User")
    return (parts[0], " ".join(parts[1:]))


async def provision_zoho_mailbox_if_enabled(
    username: str,
    full_name: str,
    email_address: str,
    mailbox_password: str,
) -> bool:
    if not ZOHO_MAIL_ENABLED:
        return False

    if not ZOHO_MAIL_ORG_ID:
        logging.warning("Zoho mailbox provisioning skipped; missing ZOHO_MAIL_ORG_ID")
        return False

    org_token = await zoho_org_token_manager.get_token()
    if not org_token:
        logging.warning("Zoho mailbox provisioning skipped; no org OAuth token available")
        return False

    first_name, last_name = _split_name(full_name)
    payload = {
        "primaryEmailAddress": email_address,
        "displayName": full_name or username,
        "firstName": first_name,
        "lastName": last_name,
        "password": mailbox_password,
    }
    headers = {
        "Authorization": f"Zoho-oauthtoken {org_token}",
        "Content-Type": "application/json",
    }
    endpoint = f"{ZOHO_MAIL_API_BASE}/organization/{ZOHO_MAIL_ORG_ID}/accounts"

    async with httpx.AsyncClient(timeout=20.0) as client_http:
        try:
            response = await client_http.post(endpoint, headers=headers, json=payload)
            if 200 <= response.status_code < 300:
                logging.info("Zoho mailbox provisioned for %s via %s", email_address, endpoint)
                return True

            body = response.text.lower()
            if response.status_code in (400, 409) and ("exist" in body or "duplicate" in body):
                logging.info("Zoho mailbox already exists for %s", email_address)
                return True
            logging.error(
                "Zoho mailbox provisioning returned %s for %s: %s",
                response.status_code,
                endpoint,
                (response.text or "")[:400],
            )
        except Exception as e:
            logging.error("Zoho mailbox provisioning request failed (%s): %s", endpoint, e)

    return False

async def send_verification_email(email: str, token: str, user_name: str, otp: Optional[str] = None):
    verification_link = f"{FRONTEND_URL}/verify-email?token={token}" if token else ""
    display_name = user_name if user_name and user_name != "there" else ""
    greeting = f"Hi {display_name}," if display_name else "Hi there,"

    otp_digits = ""
    if otp:
        otp_digits = "".join(
            f'<td style="width:44px;height:52px;background-color:#1A1D24;border:1px solid #2A2D35;'
            f'border-radius:10px;text-align:center;font-size:26px;font-weight:700;'
            f'font-family:\'Courier New\',monospace;color:#ffffff;letter-spacing:1px;">{ch}</td>'
            f'<td style="width:8px;"></td>'
            for ch in str(otp)
        )

    link_row = ""
    if verification_link:
        link_row = (
            f'<tr><td style="padding:24px 0 0;">'
            f'<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">'
            f'<tr><td style="background-color:#3B82F6;border-radius:12px;text-align:center;">'
            f'<a href="{verification_link}" style="display:inline-block;padding:14px 36px;'
            f'color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;'
            f'font-family:Arial,Helvetica,sans-serif;">Verify Email</a>'
            f'</td></tr></table></td></tr>'
            f'<tr><td style="padding:12px 0 0;text-align:center;font-size:12px;color:#52525B;'
            f'font-family:Arial,Helvetica,sans-serif;">Or copy this link: {verification_link}</td></tr>'
        )

    html_content = f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="color-scheme" content="dark"/>
<meta name="supported-color-schemes" content="dark"/>
<title>Verify your Lynkr account</title>
<!--[if mso]><style>table,td{{font-family:Arial,Helvetica,sans-serif !important;}}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#08090C;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#08090C;">
Your Lynkr verification code is {otp or "ready"} &mdash; enter it to get started.
&#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="background-color:#08090C;min-height:100%;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560"
       style="max-width:560px;width:100%;border-radius:20px;overflow:hidden;border:1px solid #1A1D24;">
  <tr><td style="background:linear-gradient(135deg,#0F1219 0%,#161B26 40%,#1B2436 100%);padding:40px 40px 32px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
      <td style="font-size:42px;font-weight:400;color:#D4D4D8;font-family:'Brush Script MT','Segoe Script','Apple Chancery',cursive;letter-spacing:2px;text-align:center;">Lynkr</td>
    </tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px auto 0;"><tr>
      <td style="width:40px;height:3px;border-radius:2px;background:linear-gradient(90deg,#3B82F6,#60A5FA);"></td>
    </tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px auto 0;"><tr>
      <td style="font-size:13px;color:#71717A;font-family:Arial,Helvetica,sans-serif;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;">Verify Your Identity</td>
    </tr></table>
  </td></tr>
  <tr><td style="background-color:#0F1117;padding:36px 40px 40px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="font-size:15px;color:#A1A1AA;font-family:Arial,Helvetica,sans-serif;padding-bottom:8px;">{greeting}</td></tr>
    <tr><td style="font-size:22px;font-weight:700;color:#F4F4F5;font-family:Arial,Helvetica,sans-serif;padding-bottom:12px;line-height:1.3;">Here&rsquo;s your verification code</td></tr>
    <tr><td style="font-size:15px;color:#71717A;font-family:Arial,Helvetica,sans-serif;line-height:1.6;padding-bottom:28px;">Enter this code in the Lynkr app to verify your email address. It expires in {VERIFICATION_OTP_EXPIRE_MINUTES} minutes.</td></tr>
    </table>
    {"" if not otp else f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;"><tr><td><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:#12141B;border:1px solid #1E2130;border-radius:16px;padding:28px 24px;margin:0 auto;width:100%;"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>{otp_digits}</tr></table></td></tr></table></td></tr></table>'}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#12141B;border-radius:12px;border-left:3px solid #3B82F6;margin-top:20px;">
    <tr><td style="padding:16px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="font-size:13px;color:#A1A1AA;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
          <span style="font-weight:600;color:#D4D4D8;">Didn&rsquo;t request this?</span><br/>If you didn&rsquo;t create a Lynkr account, you can safely ignore this email.
        </td>
      </tr></table>
    </td></tr></table>
    {link_row}
  </td></tr>
  <tr><td style="background-color:#0F1117;padding:0 40px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="height:1px;background:linear-gradient(90deg,transparent,#1E2130,transparent);font-size:0;line-height:0;">&nbsp;</td></tr></table>
  </td></tr>
  <tr><td style="background-color:#0F1117;padding:24px 40px 32px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="font-size:12px;color:#52525B;font-family:Arial,Helvetica,sans-serif;line-height:1.7;">
      Sent by <span style="color:#71717A;font-weight:600;">Lynkr</span> &middot; <a href="https://lynkr.club" style="color:#3B82F6;text-decoration:none;">lynkr.club</a><br/>
      <a href="mailto:admin@lynkr.club" style="color:#52525B;text-decoration:none;">Need help? Contact us</a>
    </td></tr></table>
  </td></tr>
</table>
</td></tr></table>
</body></html>"""
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": "Verify your Lynkr account – your verification code",
            "html": html_content,
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logging.info("Verification email sent to %s", email)
    except Exception as e:
        msg = str(e)
        if "domain is not verified" in msg.lower() or "resend.com/domains" in msg:
            logging.error(
                "Failed to send verification email: %s. Add and verify your sending domain at https://resend.com/domains or set SENDER_EMAIL to a verified address.",
                msg,
            )
        else:
            logging.error("Failed to send verification email: %s", e)


async def ensure_user_identity(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    if not user_doc or not user_doc.get("id"):
        return user_doc

    updates: Dict[str, Any] = {}
    username = normalize_username(user_doc.get("username") or "")
    if not USERNAME_REGEX.fullmatch(username):
        base = normalize_username((user_doc.get("email") or "").split("@")[0])
        base = re.sub(r"[^a-z0-9_]", "", base)[:16] or f"user{str(user_doc['id'])[:6]}"
        candidate = base
        suffix = 1
        while await db.users.username_exists(candidate, exclude_id=user_doc["id"]):
            candidate = f"{base}_{suffix}"
            suffix += 1
        username = candidate
        updates["username"] = username

    avatar = (user_doc.get("avatar") or "").strip()
    if not is_valid_avatar(avatar):
        avatar = DEFAULT_AVATAR
        updates["avatar"] = avatar

    if updates:
        await db.users.update_one(user_doc["id"], **updates)
        user_doc = {**user_doc, **updates}
    return user_doc

def _validate_coupon_payload(payload: Dict[str, Any]):
    now = datetime.now(timezone.utc)
    value_type = payload.get("value_type")
    if value_type and value_type not in (CouponValueType.FIXED, CouponValueType.PERCENTAGE):
        raise HTTPException(status_code=400, detail="value_type must be 'percentage' or 'fixed'")
    if payload.get("value") is not None and payload["value"] <= 0:
        raise HTTPException(status_code=400, detail="value must be > 0")
    if payload.get("total_quantity") is not None and payload["total_quantity"] <= 0:
        raise HTTPException(status_code=400, detail="total_quantity must be > 0")
    if payload.get("points_cost") is not None and payload["points_cost"] <= 0:
        raise HTTPException(status_code=400, detail="points_cost must be > 0")
    if payload.get("min_purchase") is not None and payload["min_purchase"] < 0:
        raise HTTPException(status_code=400, detail="min_purchase must be >= 0")
    if payload.get("user_limit") is not None and payload["user_limit"] <= 0:
        raise HTTPException(status_code=400, detail="user_limit must be > 0")
    if payload.get("expiry_date") is not None and payload["expiry_date"] <= now:
        raise HTTPException(status_code=400, detail="expiry_date must be in the future")


async def _hydrate_coupon_partners(coupons: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not coupons:
        return []
    partner_ids = sorted({c.get("partner_id") for c in coupons if c.get("partner_id")})
    partners = await db.partners.find_by_ids(partner_ids, fields=["id", "business_name", "logo"])
    partner_map = {p["id"]: p for p in partners}
    hydrated = []
    for coupon in coupons:
        partner = partner_map.get(coupon.get("partner_id"), {})
        remaining = max(0, int(coupon.get("total_quantity", 0)) - int(coupon.get("redeemed_count", 0)))
        item = {
            **coupon,
            "partner_name": partner.get("business_name"),
            "partner_logo": coupon.get("brand_logo") or partner.get("logo"),
            "remaining_quantity": remaining,
        }
        hydrated.append(item)
    return hydrated


def _mask_username(full_name: Optional[str], email: Optional[str], user_id: str) -> str:
    source = (full_name or "").strip() or (email or "").split("@")[0].strip() or f"user{user_id[:4]}"
    clean = "".join(ch for ch in source if ch.isalnum() or ch in ("_", "-"))
    if len(clean) <= 2:
        masked_core = clean[0] + "*" if clean else "u*"
    elif len(clean) <= 5:
        masked_core = clean[0] + ("*" * (len(clean) - 2)) + clean[-1]
    else:
        masked_core = clean[:2] + ("*" * (len(clean) - 4)) + clean[-2:]
    return f"{masked_core}_{user_id[:4]}"


async def _get_partner_id_for_user(user_id: str) -> str:
    """For PARTNER-role JWTs, user_id IS the partner id. Verify it exists."""
    partner = await db.partners.get_by_id(user_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    return user_id


async def credit_user_points(user_id: str, amount: float, description: str) -> Dict[str, Any]:
    points_to_credit = int(float(amount) * 0.25)
    if points_to_credit <= 0:
        return {"credited_points": 0, "new_balance": None}

    user_record = await db.users.get_by_id(user_id)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found for points credit")

    new_balance = int(user_record.get("points", 0)) + points_to_credit
    await db.users.update_one(user_id, points=new_balance)

    ledger_entry = PointsLedger(
        user_id=user_id,
        type="CREDIT",
        amount=points_to_credit,
        description=description,
        balance_after=new_balance,
    )
    await db.points_ledger.insert_one({
        "id": ledger_entry.id,
        "user_id": user_id,
        "type": "CREDIT",
        "amount": points_to_credit,
        "description": description,
        "balance_after": new_balance,
        "created_at": ledger_entry.created_at,
    })
    return {"credited_points": points_to_credit, "new_balance": new_balance}


async def process_pending_credits() -> Dict[str, Any]:
    """Credit points for VERIFIED purchases whose return window has elapsed."""
    uncredited = await db.purchases.find_uncredited_verified(limit=500)
    credited_count = 0
    for p in uncredited:
        partner_id = p.get("partner_id")
        if not partner_id:
            continue
        partner = await db.partners.get_by_id(partner_id)
        if not partner:
            continue
        window_days = partner.get("return_window_days") or 0
        if window_days <= 0:
            window_days = 0

        verified_at_str = p.get("verified_at")
        if not verified_at_str:
            continue
        try:
            verified_at = datetime.fromisoformat(verified_at_str)
        except (ValueError, TypeError):
            continue

        if verified_at.tzinfo is None:
            verified_at = verified_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) < verified_at + timedelta(days=window_days):
            continue

        partner_name = partner.get("business_name", "Partner")
        await credit_user_points(
            user_id=p["user_id"],
            amount=float(p["amount"]),
            description=f"Purchase verified: {partner_name} (after {window_days}-day return window)",
        )
        await db.purchases.update_one(p["id"], points_credited=True)

        try:
            await _trigger_referral_reward_if_eligible(p["user_id"])
        except Exception:
            pass

        credited_count += 1

    return {"processed": credited_count}


async def _trigger_referral_reward_if_eligible(user_id: str) -> None:
    """Award referral bonus points on the user's first verified purchase."""
    INVITER_REWARD = 100
    INVITEE_REWARD = 50

    user_doc = await db.users.get_by_id(user_id)
    if not user_doc or user_doc.get("has_made_first_purchase"):
        return

    await db.users.update_one(user_id, has_made_first_purchase=True)

    referred_by = user_doc.get("referred_by")
    if not referred_by:
        return

    txn = await db.referrals.get_by_invitee(user_id)
    if not txn or txn.get("reward_given"):
        return

    inviter = await db.users.get_by_id(referred_by)
    if not inviter:
        return

    invitee_balance = int(user_doc.get("points", 0)) + INVITEE_REWARD
    await db.users.update_one(user_id, points=invitee_balance)
    await db.points_ledger.insert_one({
        "user_id": user_id,
        "type": "CREDIT",
        "amount": INVITEE_REWARD,
        "description": "Referral bonus — welcome reward",
        "balance_after": invitee_balance,
    })

    inviter_balance = int(inviter.get("points", 0)) + INVITER_REWARD
    await db.users.update_one(referred_by, points=inviter_balance)
    await db.points_ledger.insert_one({
        "user_id": referred_by,
        "type": "CREDIT",
        "amount": INVITER_REWARD,
        "description": f"Referral reward — {user_doc.get('username', 'friend')} made first purchase",
        "balance_after": inviter_balance,
    })

    await db.referrals.update_one(
        txn["id"],
        reward_given=True,
        inviter_points=INVITER_REWARD,
        invitee_points=INVITEE_REWARD,
    )


async def _set_purchase_verification_status(
    purchase: Dict[str, Any],
    action: str,
    verification_source: str,
    credit_description: Optional[str] = None,
) -> Dict[str, Any]:
    if action not in {"VERIFY", "REJECT"}:
        raise HTTPException(status_code=400, detail="Invalid action")

    if purchase.get("status") != PurchaseStatus.PENDING:
        raise HTTPException(status_code=400, detail="Purchase already processed")

    now_iso = datetime.now(timezone.utc).isoformat()
    if action == "VERIFY":
        partner_id = purchase.get("partner_id")
        return_window = 0
        if partner_id:
            partner = await db.partners.get_by_id(partner_id)
            if partner:
                return_window = partner.get("return_window_days") or 0

        if return_window > 0:
            await db.purchases.update_one(
                purchase["id"],
                status=PurchaseStatus.VERIFIED,
                verification_source=verification_source,
                verified_at=now_iso,
                points_credited=False,
            )
            return {
                "success": True,
                "new_status": PurchaseStatus.VERIFIED,
                "credited_points": 0,
                "new_balance": None,
                "delayed_days": return_window,
            }

        await db.purchases.update_one(
            purchase["id"],
            status=PurchaseStatus.VERIFIED,
            verification_source=verification_source,
            verified_at=now_iso,
            points_credited=True,
        )
        credit_result = await credit_user_points(
            user_id=purchase["user_id"],
            amount=float(purchase["amount"]),
            description=credit_description or f"Purchase verified: {purchase.get('brand', 'Partner purchase')}",
        )

        try:
            await _trigger_referral_reward_if_eligible(purchase["user_id"])
        except Exception:
            pass

        return {"success": True, "new_status": PurchaseStatus.VERIFIED, **credit_result}

    await db.purchases.update_one(
        purchase["id"],
        status=PurchaseStatus.REJECTED,
        verification_source=verification_source,
        verified_at=now_iso,
    )
    return {"success": True, "new_status": PurchaseStatus.REJECTED}


def _domain_from_value(value: str) -> str:
    if not value:
        return ""
    value = value.strip().lower()
    if "@" in value:
        return value.split("@", 1)[1]
    if value.startswith("http://") or value.startswith("https://"):
        host = value.split("://", 1)[1].split("/", 1)[0]
        return host.replace("www.", "")
    return value.replace("www.", "")


def _pick_lynkr_recipient(recipients: List[str]) -> Optional[str]:
    if not recipients:
        return None
    domain_suffix = f"@{ZOHO_MAIL_DOMAIN}"
    for recipient in recipients:
        candidate = (recipient or "").strip().lower()
        if candidate.endswith(domain_suffix):
            return candidate
    return None


async def _log_email_ingest(event_type: str, status: str, message: str, details: Optional[Dict[str, Any]] = None):
    payload = {
        "id": str(uuid.uuid4()),
        "event_type": event_type,
        "status": status,
        "message": message,
        "details": details or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.email_ingest_logs.insert_one(payload)


async def _mark_email_processed(message_id: str, state: str, details: Optional[Dict[str, Any]] = None):
    if not message_id:
        return
    await db.email_ingest_processed.upsert(
        message_id,
        state=state,
        details=details or {},
        updated_at=datetime.now(timezone.utc).isoformat(),
    )


async def _match_partner_from_email(sender_domain: str, parsed_partner_name: str) -> Optional[Dict[str, Any]]:
    partners = await db.partners.find_all(limit=2000)
    if not partners:
        return None

    sender_domain = _domain_from_value(sender_domain)
    if sender_domain:
        for partner in partners:
            website_domain = _domain_from_value(partner.get("website") or "")
            contact_domain = _domain_from_value(partner.get("contact_email") or "")
            extra_domains = [_domain_from_value(value) for value in (partner.get("domains") or [])] if isinstance(partner.get("domains"), list) else []
            known_domains = {website_domain, contact_domain, *extra_domains}
            known_domains = {domain for domain in known_domains if domain}
            if sender_domain in known_domains:
                return partner

    normalized_target = re.sub(r"[^a-z0-9]", "", (parsed_partner_name or "").lower())
    if normalized_target:
        for partner in partners:
            partner_name = re.sub(r"[^a-z0-9]", "", (partner.get("business_name") or "").lower())
            if partner_name and (normalized_target in partner_name or partner_name in normalized_target):
                return partner

    return None


async def _create_auto_purchase(
    user_record: Dict[str, Any],
    partner: Dict[str, Any],
    parsed: Dict[str, Any],
    sender_email: str,
    message_id: str,
):
    order_id = (parsed.get("order_id") or "").strip()
    transaction_id = (parsed.get("transaction_id") or "").strip()
    amount = float(parsed.get("amount") or 0)

    if amount <= 0:
        raise ValueError("Invalid amount extracted from email")
    if len(order_id) <= 5:
        raise ValueError("Order ID is too short")
    if not transaction_id:
        raise ValueError("Transaction ID missing in email")

    duplicate = await db.purchases.find_duplicate(order_id, transaction_id)
    if duplicate:
        raise DuplicateKeyError("Duplicate order/transaction found")

    purchase = Purchase(
        user_id=user_record["id"],
        brand=partner.get("business_name") or parsed.get("partner_name") or "Partner",
        partner_id=partner.get("id"),
        order_id=order_id,
        transaction_id=transaction_id,
        amount=amount,
        status=PurchaseStatus.PENDING,
        submitted_by_user=False,
        source="EMAIL_AUTO",
        verification_source=VerificationSource.AUTO,
        category=SpendingCategory.OTHER,
    )
    purchase_doc = {
        "id": purchase.id,
        "user_id": purchase.user_id,
        "brand": purchase.brand,
        "partner_id": purchase.partner_id,
        "order_id": purchase.order_id,
        "transaction_id": purchase.transaction_id,
        "amount": purchase.amount,
        "status": purchase.status,
        "submitted_by_user": purchase.submitted_by_user,
        "source": purchase.source,
        "verification_source": purchase.verification_source,
        "category": purchase.category,
        "timestamp": purchase.timestamp,
        "detected_at": purchase.detected_at,
        "email_message_id": message_id,
        "email_sender": sender_email,
    }
    await db.purchases.insert_one(purchase_doc)

    partner_order = PartnerOrder(
        partner_id=partner.get("id"),
        purchase_id=purchase.id,
        user_lynkr_email=user_record.get("lynkr_email", ""),
        order_id=order_id,
        transaction_id=transaction_id,
        amount=amount,
        status="PENDING",
    )
    await db.partner_orders.insert_one({
        "id": partner_order.id,
        "partner_id": partner_order.partner_id,
        "purchase_id": partner_order.purchase_id,
        "user_lynkr_email": partner_order.user_lynkr_email,
        "order_id": partner_order.order_id,
        "transaction_id": partner_order.transaction_id,
        "amount": partner_order.amount,
        "status": partner_order.status,
        "created_at": partner_order.created_at,
    })
    return purchase


async def run_email_ingest_cycle() -> Dict[str, int]:
    if not EMAIL_INGEST_ENABLED or not app_state.email_ingest_service:
        return {"processed": 0, "created": 0, "skipped": 0, "failed": 0}

    messages = await app_state.email_ingest_service.fetch_all_unread(limit_per_mailbox=EMAIL_INGEST_BATCH_SIZE)
    if not messages:
        return {"processed": 0, "created": 0, "skipped": 0, "failed": 0}

    partners = await db.partners.find_all(limit=2000)
    known_domains = []
    for partner in partners:
        for key in ("website", "contact_email"):
            value = partner.get(key)
            if value:
                known_domains.append(_domain_from_value(value))

    processed = created = skipped = failed = 0

    for mail in messages:
        processed += 1
        message_id = mail.get("message_id")
        account_id = mail.get("mailbox_account_id", "")
        subject = mail.get("subject", "")
        body = mail.get("body", "")
        sender_email = (mail.get("sender_email") or "").strip().lower()
        sender_domain = (mail.get("sender_domain") or _domain_from_value(sender_email)).strip().lower()
        recipients = mail.get("recipients") or []
        mailbox_email = mail.get("mailbox_email", "")

        already_processed = await db.email_ingest_processed.find_by_message_id(message_id)
        if already_processed:
            skipped += 1
            continue

        if not is_purchase_email(subject=subject, body=body, sender_domain=sender_domain, known_partner_domains=known_domains):
            skipped += 1
            await _mark_email_processed(message_id, "ignored", {"reason": "non_purchase_email", "subject": subject[:120]})
            continue

        parsed = parse_purchase_email(email_body=body, subject=subject, sender_email=sender_email)
        recipient_email = _pick_lynkr_recipient(recipients) or mailbox_email
        if not recipient_email:
            skipped += 1
            await _log_email_ingest("ingest_skip", "skipped", "No Lynkr recipient found in email", {"message_id": message_id})
            await _mark_email_processed(message_id, "skipped", {"reason": "recipient_not_found"})
            continue

        user_record = await db.users.get_by_lynkr_email(recipient_email)
        if not user_record:
            skipped += 1
            await _log_email_ingest("ingest_skip", "skipped", "No user found for recipient email", {"message_id": message_id, "recipient_email": recipient_email})
            await _mark_email_processed(message_id, "skipped", {"reason": "user_not_found", "recipient_email": recipient_email})
            continue

        partner = await _match_partner_from_email(sender_domain=sender_domain, parsed_partner_name=parsed.get("partner_name") or "")
        if not partner:
            skipped += 1
            await _log_email_ingest("ingest_skip", "skipped", "Partner could not be matched", {"message_id": message_id, "sender_domain": sender_domain, "partner_name": parsed.get("partner_name")})
            await _mark_email_processed(message_id, "skipped", {"reason": "partner_not_found"})
            continue

        try:
            purchase = await _create_auto_purchase(
                user_record=user_record,
                partner=partner,
                parsed=parsed,
                sender_email=sender_email,
                message_id=message_id,
            )
            created += 1
            await _log_email_ingest(
                "purchase_created",
                "success",
                "Automatic purchase created from email",
                {"message_id": message_id, "purchase_id": purchase.id, "user_id": user_record.get("id"), "partner_id": partner.get("id")},
            )
            await _mark_email_processed(message_id, "created", {"purchase_id": purchase.id})
            await app_state.email_ingest_service.mark_email_read(message_id, account_id)
        except DuplicateKeyError:
            skipped += 1
            await _log_email_ingest("duplicate_skip", "skipped", "Duplicate order or transaction id detected", {"message_id": message_id, "order_id": parsed.get("order_id"), "transaction_id": parsed.get("transaction_id")})
            await _mark_email_processed(message_id, "duplicate", {"order_id": parsed.get("order_id"), "transaction_id": parsed.get("transaction_id")})
        except Exception as exc:
            failed += 1
            await _log_email_ingest("parse_failure", "error", f"Email ingestion failed: {exc}", {"message_id": message_id, "subject": subject[:120]})
            await _mark_email_processed(message_id, "failed", {"error": str(exc)})

    return {"processed": processed, "created": created, "skipped": skipped, "failed": failed}

def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"

def _extract_palette_from_bytes(image_bytes: bytes, num_colors: int = 6) -> list:
    """Extract dominant colors from image bytes using Pillow k-means quantization."""
    from PIL import Image as PILImage
    import io
    img = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((150, 150))
    quantized = img.quantize(colors=num_colors, method=PILImage.Quantize.MEDIANCUT)
    palette_data = quantized.getpalette()
    if not palette_data:
        return []
    colors = []
    for i in range(num_colors):
        r, g, b = palette_data[i * 3], palette_data[i * 3 + 1], palette_data[i * 3 + 2]
        colors.append({"r": r, "g": g, "b": b, "hex": f"#{r:02x}{g:02x}{b:02x}"})
    return colors

def _get_chat_llm():
    """Use Gemini if GEMINI_API_KEY is set, else OpenAI."""
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if gemini_key:
        from app.ai.llm_client import GeminiClient
        model = os.environ.get("GEMINI_CHAT_MODEL", "gemini-2.0-flash").strip()
        return ("gemini", GeminiClient(api_key=gemini_key, model=model))
    return ("openai", None)

def _slugify(s: str) -> str:
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "catalog"

def _get_ai_pipeline():
    global _ai_pipeline
    if _ai_pipeline is None:
        try:
            from app.services.ai_pipeline import create_default_pipeline
            from app.ai.llm_client import OpenAIClient
            api_key = os.environ.get("OPENAI_API_KEY") or ""
            llm = OpenAIClient(api_key=api_key) if api_key else None
            _ai_pipeline = create_default_pipeline(llm_client=llm, ai_disabled=os.environ.get("LYNKR_AI_DISABLED", "").lower() in ("1", "true", "yes"))
        except Exception as e:
            logging.getLogger(__name__).warning("AI pipeline init failed, using deterministic-only: %s", e)
            from app.services.ai_pipeline import create_default_pipeline
            _ai_pipeline = create_default_pipeline(llm_client=None, ai_disabled=True)
    return _ai_pipeline
