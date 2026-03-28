"""
Shared imports and symbols for modular route modules.
Intentionally flat re-exports to preserve handler bodies identical to server.py.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import httpx
import jwt
import resend
import logging

from fastapi import Depends, File, HTTPException, Request, UploadFile, status
from pgdoc import DuplicateKeyError

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False
    LlmChat = None
    UserMessage = None

from app.api.deps import get_current_user, require_role
from app.core import config as cfg
from app.core.clients import openai_client, zoho_org_token_manager
from app.core.config import (
    ALLOWED_IMAGE_TYPES,
    DEFAULT_AVATAR,
    FRONTEND_URL,
    MAX_IMAGE_SIZE,
    PILOT_LAUNCHING_MESSAGE,
    PROFILE_UPLOADS_DIR,
    SIGNUP_DISABLED,
    UPLOADS_DIR,
    USERNAME_CHANGE_COOLDOWN_HOURS,
    USERNAME_REGEX,
    VERIFICATION_OTP_EXPIRE_MINUTES,
    WAITLIST_MAX_BRANDS,
    WAITLIST_RECENT_LIMIT,
    ZOHO_MAIL_ENABLED,
)
from app.db.database import db
from app.schemas.api.domain_models import (
    AdminCreateUserRequest,
    AIInsights,
    CatalogProduct,
    CatalogProductCreate,
    CatalogProductUpdate,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    Coupon,
    CouponCreate,
    CouponUpdate,
    CreateAdminRequest,
    LeadSignupRequest,
    Partner,
    PartnerCreate,
    PartnerCouponRequest,
    PartnerCouponRequestCreate,
    PartnerCouponRequestStatus,
    PartnerCouponRequestUpdate,
    PartnerOrder,
    PartnerOrderResponse,
    PartnerPurchaseItem,
    PartnerStatus,
    PartnerSurvey,
    PartnerVerifyPurchaseRequest,
    PasswordChange,
    PointsLedger,
    PrivacySettingsUpdate,
    Purchase,
    PurchaseCreate,
    PurchaseResponse,
    PurchaseStatus,
    RaisePurchaseRequest,
    RecordResolutionBody,
    Redemption,
    SpendingCategory,
    User,
    UserLogin,
    UserPointsUpdate,
    UserProfileUpdate,
    UserPurchaseUpdateRequest,
    UserResponse,
    UserRole,
    UserSignup,
    UserSurvey,
    UsernameAvailabilityResponse,
    VerificationSource,
    VerifyEmailOtpRequest,
    WaitlistSignupRequest,
    NotificationPreferencesUpdate,
    ReferralApplyRequest,
    ReferralStatsResponse,
    RequestSignupOtp,
    DynamicCouponConfigCreate,
    DynamicCouponConfigUpdate,
    DynamicCouponUserRequest,
    DynamicCouponInventoryCreate,
    DynamicCouponApproval,
    DynamicCouponRequestStatus,
)
from app.services.business_logic import (
    _allocate_unique_partner_username,
    _create_auto_purchase,
    _domain_from_value,
    _extract_palette_from_bytes,
    _get_ai_pipeline,
    _get_chat_llm,
    _get_client_ip,
    _get_partner_id_for_user,
    _hydrate_coupon_partners,
    _log_email_ingest,
    _mark_email_processed,
    _mask_username,
    _match_partner_from_email,
    _set_purchase_verification_status,
    _slugify,
    _validate_coupon_payload,
    _ensure_user_for_partner,
    create_access_token,
    credit_user_points,
    ensure_user_identity,
    generate_random_password,
    generate_verification_otp,
    generate_verification_token,
    generate_lynkr_email,
    hash_password,
    is_valid_avatar,
    normalize_email,
    normalize_username,
    provision_zoho_mailbox_if_enabled,
    run_email_ingest_cycle,
    send_verification_email,
    verify_password,
)
from security import BRUTE_FORCE_LOCK_MINUTES, brute_force_storage, log_security_event
from services.waitlist_file import (
    append_entry as waitlist_append_entry,
    email_exists as waitlist_email_exists,
    get_recent_entries as waitlist_get_recent,
)

logger = logging.getLogger(__name__)

# `import *` skips _underscored names unless __all__ is set.
# Route modules rely on wildcard import from this file, so expose everything.
__all__ = [name for name in dir() if not name.startswith("__")]
