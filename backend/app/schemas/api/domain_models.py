"""API / domain Pydantic models (extracted from server.py)."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.config import DEFAULT_AVATAR

class UserRole:
    USER = "USER"
    PARTNER = "PARTNER"
    ADMIN = "ADMIN"

class PurchaseStatus:
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class VerificationSource:
    ADMIN = "ADMIN"
    PARTNER = "PARTNER"
    AUTO = "AUTO"

class PartnerStatus:
    PENDING = "PENDING"
    PILOT = "PILOT"
    ACTIVE = "ACTIVE"

class SpendingCategory:
    FASHION = "Fashion"
    FOOD = "Food & Dining"
    TRAVEL = "Travel"
    ELECTRONICS = "Electronics"
    GROCERIES = "Groceries"
    ENTERTAINMENT = "Entertainment"
    HEALTH = "Health & Beauty"
    OTHER = "Other"

# User Models
class RequestSignupOtp(BaseModel):
    email: EmailStr


class LeadSignupRequest(BaseModel):
    """Public lead/guide signup from landing or partner page."""
    email: EmailStr
    source: str = "landing"  # "landing" | "partner"


class WaitlistSignupRequest(BaseModel):
    """Early-access waitlist signup with optional favorite brands."""
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    age: str = Field(..., min_length=1, max_length=20)  # e.g. "18-24", "25-34"
    gender: str = Field(..., min_length=1, max_length=40)
    favorite_brands: List[str] = Field(default_factory=list, max_length=100)  # user-defined tags
    city: Optional[str] = Field(None, max_length=80)


class UserSignup(BaseModel):
    username: str
    avatar: str
    email: EmailStr
    password: str
    full_name: str
    phone: str
    dob: date
    gender: str
    role: str = UserRole.USER
    terms_accepted: bool = False
    signup_otp: Optional[str] = None
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class CreateAdminRequest(BaseModel):
    """Request body for setup/create-admin. Protected by ADMIN_CREATE_SECRET."""
    email: EmailStr
    password: str
    full_name: str
    username: str
    secret: str


class AdminCreateUserRequest(BaseModel):
    """Request body for admin/create-user. Creates a USER-role app user (no OTP/signup flow)."""
    email: EmailStr
    password: str
    full_name: str
    username: str
    phone: str = ""
    dob: Optional[str] = None  # YYYY-MM-DD
    gender: str = ""

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    full_name: str
    username: str
    phone: str
    dob: str
    gender: str
    role: str
    lynkr_email: str
    email_status: str = "ACTIVE"
    email_verified: bool = False
    verification_token: Optional[str] = None
    points: int = 0
    avatar: str = DEFAULT_AVATAR
    profile_photo: Optional[str] = None
    username_changed_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    onboarding_complete: bool = False
    notification_preferences: dict = Field(default_factory=lambda: {
        "email_purchases": True,
        "email_rewards": True,
        "sms_purchases": False,
        "sms_rewards": False
    })
    privacy_settings: dict = Field(default_factory=lambda: {
        "share_anonymous_data": True,
        "marketing_emails": False
    })
    theme_colors: Optional[dict] = None
    partner_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    username: Optional[str] = None
    phone: str
    dob: str
    gender: str
    role: str
    lynkr_email: str
    points: int
    email_verified: bool
    avatar: str
    profile_photo: Optional[str] = None
    partner_logo: Optional[str] = None
    extracted_palette: Optional[list] = None
    onboarding_complete: bool
    notification_preferences: dict
    privacy_settings: dict
    theme_colors: Optional[dict] = None
    referral_code: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    avatar: Optional[str] = None


class UsernameAvailabilityResponse(BaseModel):
    username: str
    normalized_username: str
    available: bool
    hint: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class NotificationPreferencesUpdate(BaseModel):
    email_purchases: Optional[bool] = None
    email_rewards: Optional[bool] = None
    sms_purchases: Optional[bool] = None
    sms_rewards: Optional[bool] = None

class PrivacySettingsUpdate(BaseModel):
    share_anonymous_data: Optional[bool] = None
    marketing_emails: Optional[bool] = None

# Purchase Models
class Purchase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    brand: str
    partner_id: Optional[str] = None
    order_id: str
    transaction_id: Optional[str] = None
    amount: float
    status: str = PurchaseStatus.PENDING
    submitted_by_user: bool = False
    source: Optional[str] = None
    edited_once: bool = False
    verification_source: Optional[str] = None  # ADMIN | PARTNER | AUTO
    category: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verified_at: Optional[datetime] = None

class PurchaseCreate(BaseModel):
    brand: str
    order_id: str
    amount: float

class PurchaseResponse(BaseModel):
    id: str
    brand: str
    order_id: str
    transaction_id: Optional[str] = None
    amount: float
    status: str
    category: Optional[str]
    timestamp: str


class RaisePurchaseRequest(BaseModel):
    partner_id: str
    order_id: str
    transaction_id: str
    amount: float


class UserPurchaseUpdateRequest(BaseModel):
    partner_id: Optional[str] = None
    order_id: Optional[str] = None
    transaction_id: Optional[str] = None
    amount: Optional[float] = None


class PartnerPurchaseItem(BaseModel):
    purchase_id: str
    user_lynkr_email: str
    order_id: str
    transaction_id: Optional[str] = None
    amount: float
    status: str
    created_at: str


class PartnerVerifyPurchaseRequest(BaseModel):
    purchase_id: str
    action: str  # VERIFY | REJECT

# Points Ledger Models
class PointsLedger(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # CREDIT or DEBIT
    amount: int
    description: str
    balance_after: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserPointsUpdate(BaseModel):
    operation: str  # add | subtract | set
    points: int
    reason: Optional[str] = None


class CouponValueType:
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class CouponCreate(BaseModel):
    partner_id: str
    title: str
    description: str
    coupon_code: str
    value_type: str  # percentage | fixed
    value: float
    min_purchase: Optional[float] = None
    points_cost: int
    expiry_date: datetime
    total_quantity: int
    is_active: bool = True
    coupon_type: str = "partner_specific"
    user_limit: int = 1
    campaign_tag: Optional[str] = None
    brand_logo: Optional[str] = None


class CouponUpdate(BaseModel):
    partner_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    coupon_code: Optional[str] = None
    value_type: Optional[str] = None
    value: Optional[float] = None
    min_purchase: Optional[float] = None
    points_cost: Optional[int] = None
    expiry_date: Optional[datetime] = None
    total_quantity: Optional[int] = None
    is_active: Optional[bool] = None
    coupon_type: Optional[str] = None
    user_limit: Optional[int] = None
    campaign_tag: Optional[str] = None
    brand_logo: Optional[str] = None


class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    title: str
    description: str
    coupon_code: str
    value_type: str  # percentage | fixed
    value: float
    min_purchase: Optional[float] = None
    points_cost: int
    expiry_date: datetime
    total_quantity: int
    redeemed_count: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    coupon_type: str = "partner_specific"
    user_limit: int = 1
    campaign_tag: Optional[str] = None
    brand_logo: Optional[str] = None


class Redemption(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    coupon_id: str
    coupon_code: str
    redeemed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    points_deducted: int

# Partner Models
class PartnerSignup(BaseModel):
    business_name: str
    category: str
    website: str
    monthly_orders: int
    commission_preference: str
    contact_email: EmailStr
    password: str

class PartnerCreate(BaseModel):
    business_name: str
    category: str
    website: str
    contact_email: EmailStr
    contact_person: str
    password: Optional[str] = None

class Partner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_name: str
    category: str
    website: str
    monthly_orders: int = 0
    commission_preference: str = "2%"
    contact_email: EmailStr
    contact_person: str = ""
    password_hash: str
    status: str = PartnerStatus.PENDING
    temp_password: Optional[str] = None
    must_change_password: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PartnerResponse(BaseModel):
    id: str
    business_name: str
    category: str
    status: str
    monthly_orders: int

class PartnerOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    purchase_id: str
    user_lynkr_email: str
    order_id: str
    transaction_id: Optional[str] = None
    amount: float
    status: str = "PENDING"  # PENDING, ACKNOWLEDGED, DISPUTED
    acknowledged_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PartnerOrderResponse(BaseModel):
    id: str
    user_lynkr_email: str
    order_id: str
    transaction_id: Optional[str] = None
    amount: float
    status: str
    created_at: str
    acknowledged_at: Optional[str]


class PartnerCouponRequestStatus:
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PartnerCouponRequestCreate(BaseModel):
    title: str
    description: str
    discount_or_reward_details: str = ""
    points_required: int
    expiry_date: datetime
    max_redemptions: int
    terms_and_conditions: str = ""


class PartnerCouponRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    title: str
    description: str
    discount_or_reward_details: str = ""
    points_required: int
    expiry_date: datetime
    max_redemptions: int
    terms_and_conditions: str = ""
    status: str = PartnerCouponRequestStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Catalog (partner product catalog)
class CatalogProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float = 0.0
    category: str = ""
    images: List[str] = Field(default_factory=list)
    whatsapp_order_link: str = ""
    discount: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    active: bool = True


class CatalogProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    whatsapp_order_link: Optional[str] = None
    discount: Optional[str] = None
    tags: Optional[List[str]] = None
    active: Optional[bool] = None


class CatalogProduct(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    name: str
    description: str = ""
    price: float = 0.0
    category: str = ""
    images: List[str] = Field(default_factory=list)
    whatsapp_order_link: str = ""
    discount: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    # Filled by admin before approval (for creating coupon)
    value_type: str = "fixed"
    value: float = 0.0
    coupon_code: Optional[str] = None


class PartnerCouponRequestUpdate(BaseModel):
    status: Optional[str] = None  # APPROVED | REJECTED
    rejection_reason: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    discount_or_reward_details: Optional[str] = None
    points_required: Optional[int] = None
    expiry_date: Optional[datetime] = None
    max_redemptions: Optional[int] = None
    terms_and_conditions: Optional[str] = None
    value_type: Optional[str] = None
    value: Optional[float] = None
    coupon_code: Optional[str] = None


# Survey Models
class UserSurvey(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    shopping_habits: str
    reward_preferences: str
    trust_concerns: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PartnerSurvey(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    willingness_to_pilot: str
    commission_expectations: str
    feedback: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# AI Insights Model
class AIInsights(BaseModel):
    spending_by_category: dict
    top_category: str = "Other"  # default when null/None from AI or fallback
    monthly_trend: str
    spending_persona: str
    insights: List[str]
    recommendations: List[str]

# Chat Models
class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str



class VerifyEmailOtpRequest(BaseModel):
    email: EmailStr
    otp: str



class RecordResolutionBody(BaseModel):
    insight_id: str
    summary: str
    outcome: str
    user_action_taken: Optional[str] = None


class ReferralApplyRequest(BaseModel):
    referral_code: str


class ReferralInvite(BaseModel):
    invitee_id: str
    invitee_name: str
    signed_up: bool = True
    first_purchase_done: bool = False
    reward_earned: bool = False
    created_at: Optional[datetime] = None


class ReferralStatsResponse(BaseModel):
    referral_code: str
    total_invites: int = 0
    total_earned: int = 0
    pending_rewards: int = 0
    invites: List[ReferralInvite] = []


# ---------------------------------------------------------------------------
# Dynamic Coupons
# ---------------------------------------------------------------------------

class DynamicCouponRequestStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DynamicCouponConfigCreate(BaseModel):
    brand_name: str = Field(..., min_length=1, max_length=255)
    brand_logo_url: Optional[str] = None
    min_unlock_amount: int = Field(..., gt=0)
    points_cost: int = Field(..., gt=0)
    is_active: bool = True


class DynamicCouponConfigUpdate(BaseModel):
    brand_name: Optional[str] = None
    brand_logo_url: Optional[str] = None
    min_unlock_amount: Optional[int] = None
    points_cost: Optional[int] = None
    is_active: Optional[bool] = None


class DynamicCouponUserRequest(BaseModel):
    config_id: str
    requested_amount: int = Field(..., gt=0)


class DynamicCouponInventoryCreate(BaseModel):
    brand_name: str = Field(..., min_length=1, max_length=255)
    card_code: str = Field(..., min_length=1)
    card_pin: str = Field(..., min_length=1)
    value: int = Field(..., gt=0)


class DynamicCouponApproval(BaseModel):
    status: str  # "approved" or "rejected"
    admin_note: Optional[str] = None
