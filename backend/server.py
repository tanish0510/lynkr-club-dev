from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date
import httpx
from passlib.context import CryptContext
import jwt
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError, OperationFailure
# Optional import for emergentintegrations (not available on PyPI)
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False
    LlmChat = None
    UserMessage = None
import json
import resend
from openai import AsyncOpenAI


ROOT_DIR = Path(__file__).parent
# Load project root .env first (e.g. lynkr-club-dev/.env), then backend/.env
load_dotenv(ROOT_DIR.parent / '.env')
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Email Configuration
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://lynkr.club')

# Zoho Mail provisioning configuration
ZOHO_MAIL_ENABLED = (os.environ.get("ZOHO_MAIL_ENABLED", "0") or "0").strip().lower() in ("1", "true", "yes", "on")
ZOHO_MAIL_REQUIRED_ON_SIGNUP = (os.environ.get("ZOHO_MAIL_REQUIRED_ON_SIGNUP", "0") or "0").strip().lower() in ("1", "true", "yes", "on")
ZOHO_MAIL_API_BASE = (os.environ.get("ZOHO_MAIL_API_BASE", "https://mail.zoho.com/api") or "").rstrip("/")
ZOHO_MAIL_ORG_ID = (os.environ.get("ZOHO_MAIL_ORG_ID", "") or "").strip()
ZOHO_MAIL_DOMAIN = (os.environ.get("ZOHO_MAIL_DOMAIN", "lynkr.club") or "lynkr.club").strip().lower()
ZOHO_MAIL_OAUTH_TOKEN = (os.environ.get("ZOHO_MAIL_OAUTH_TOKEN", "") or "").strip()

# OpenAI Configuration
openai_client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
# Configure docs to be at /api/docs instead of /docs
app = FastAPI(
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)
api_router = APIRouter(prefix="/api")

# Root API endpoint
@api_router.get("/")
async def api_root():
    return {
        "message": "Lynkr API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "endpoints": {
            "auth": "/api/auth/login, /api/auth/signup, /api/auth/verify-email",
            "user": "/api/user/me",
            "chat": "/api/chat"
        }
    }

# ============ MODELS ============

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
class UserSignup(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    phone: str
    dob: date
    gender: str
    role: str = UserRole.USER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    full_name: str
    username: Optional[str] = None
    phone: str
    dob: str
    gender: str
    role: str
    lynkr_email: str
    email_status: str = "ACTIVE"
    email_verified: bool = False
    verification_token: Optional[str] = None
    points: int = 0
    avatar: Optional[str] = None
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
    avatar: Optional[str]
    onboarding_complete: bool
    notification_preferences: dict
    privacy_settings: dict

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    avatar: Optional[str] = None

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
    top_category: str
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

# ============ HELPER FUNCTIONS ============

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

def generate_verification_token() -> str:
    return str(uuid.uuid4())

def generate_random_password(length: int = 12) -> str:
    import random
    import string
    characters = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(random.choice(characters) for _ in range(length))


def _split_name(full_name: str) -> tuple[str, str]:
    parts = [p for p in (full_name or "").strip().split(" ") if p]
    if not parts:
        return ("Lynkr", "User")
    if len(parts) == 1:
        return (parts[0], "User")
    return (parts[0], " ".join(parts[1:]))


async def provision_zoho_mailbox_if_enabled(username: str, full_name: str, email_address: str) -> bool:
    if not ZOHO_MAIL_ENABLED:
        return False

    missing = []
    if not ZOHO_MAIL_ORG_ID:
        missing.append("ZOHO_MAIL_ORG_ID")
    if not ZOHO_MAIL_OAUTH_TOKEN:
        missing.append("ZOHO_MAIL_OAUTH_TOKEN")
    if missing:
        logging.warning("Zoho mailbox provisioning skipped; missing env keys: %s", ",".join(missing))
        return False

    first_name, last_name = _split_name(full_name)
    # Temporary mailbox password (used only for account creation in Zoho).
    temp_password = generate_random_password(16)
    payload = {
        "primaryEmailAddress": email_address,
        "displayName": full_name or username,
        "userName": username,
        "firstName": first_name,
        "lastName": last_name,
        "password": temp_password,
    }
    headers = {
        "Authorization": f"Zoho-oauthtoken {ZOHO_MAIL_OAUTH_TOKEN}",
        "Content-Type": "application/json",
    }
    endpoint_candidates = [
        f"{ZOHO_MAIL_API_BASE}/organization/{ZOHO_MAIL_ORG_ID}/accounts",
        f"{ZOHO_MAIL_API_BASE}/organization/{ZOHO_MAIL_ORG_ID}/account",
    ]

    async with httpx.AsyncClient(timeout=20.0) as client_http:
        for endpoint in endpoint_candidates:
            try:
                response = await client_http.post(endpoint, headers=headers, json=payload)
                if 200 <= response.status_code < 300:
                    logging.info("Zoho mailbox provisioned for %s", email_address)
                    return True

                body = response.text.lower()
                if response.status_code in (400, 409) and ("exist" in body or "duplicate" in body):
                    logging.info("Zoho mailbox already exists for %s", email_address)
                    return True
            except Exception as e:
                logging.warning("Zoho mailbox provisioning attempt failed (%s): %s", endpoint, e)

    logging.error("Zoho mailbox provisioning failed for %s", email_address)
    return False

async def send_verification_email(email: str, token: str, user_name: str):
    verification_link = f"{FRONTEND_URL}/verify-email?token={token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Arial', sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 40px auto; background-color: #121212; border-radius: 24px; padding: 40px; border: 1px solid rgba(255,255,255,0.05); }}
            .logo {{ font-size: 32px; font-weight: bold; margin-bottom: 24px; }}
            .button {{ display: inline-block; background-color: #3B82F6; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 24px 0; }}
            .footer {{ color: #A1A1AA; font-size: 14px; margin-top: 32px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">Lynkr</div>
            <h1>Welcome to Lynkr, {user_name}!</h1>
            <p>Thank you for signing up. Please verify your email address to get started.</p>
            <a href="{verification_link}" class="button">Verify Email Address</a>
            <p>Or copy this link: {verification_link}</p>
            <div class="footer">
                <p>If you didn't sign up for Lynkr, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": "Verify your Lynkr account",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Verification email sent to {email}")
    except Exception as e:
        logging.error(f"Failed to send verification email: {e}")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def require_role(user: User, required_role: str):
    if user.role != required_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")


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
    partners = await db.partners.find({"id": {"$in": partner_ids}}, {"_id": 0}).to_list(len(partner_ids))
    partner_map = {p["id"]: p for p in partners}
    hydrated = []
    for coupon in coupons:
        partner = partner_map.get(coupon.get("partner_id"), {})
        remaining = max(0, int(coupon.get("total_quantity", 0)) - int(coupon.get("redeemed_count", 0)))
        item = {
            **coupon,
            "partner_name": partner.get("business_name"),
            "partner_logo": partner.get("logo"),
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
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0, "partner_id": 1})
    partner_id = user_data.get("partner_id") if user_data else None
    if not partner_id:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    return partner_id


async def credit_user_points(user_id: str, amount: float, description: str) -> Dict[str, Any]:
    # Reward conversion: 1 rupee = 0.25 points.
    points_to_credit = int(float(amount) * 0.25)
    if points_to_credit <= 0:
        return {"credited_points": 0, "new_balance": None}

    user_record = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found for points credit")

    new_balance = int(user_record.get("points", 0)) + points_to_credit
    await db.users.update_one({"id": user_id}, {"$set": {"points": new_balance}})

    ledger_entry = PointsLedger(
        user_id=user_id,
        type="CREDIT",
        amount=points_to_credit,
        description=description,
        balance_after=new_balance,
    )
    ledger_doc = ledger_entry.model_dump()
    ledger_doc["created_at"] = ledger_entry.created_at.isoformat()
    await db.points_ledger.insert_one(ledger_doc)
    return {"credited_points": points_to_credit, "new_balance": new_balance}


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
        await db.purchases.update_one(
            {"id": purchase["id"]},
            {
                "$set": {
                    "status": PurchaseStatus.VERIFIED,
                    "verification_source": verification_source,
                    "verified_at": now_iso,
                }
            },
        )
        credit_result = await credit_user_points(
            user_id=purchase["user_id"],
            amount=float(purchase["amount"]),
            description=credit_description or f"Purchase verified: {purchase.get('brand', 'Partner purchase')}",
        )
        return {"success": True, "new_status": PurchaseStatus.VERIFIED, **credit_result}

    await db.purchases.update_one(
        {"id": purchase["id"]},
        {
            "$set": {
                "status": PurchaseStatus.REJECTED,
                "verification_source": verification_source,
                "verified_at": now_iso,
            }
        },
    )
    return {"success": True, "new_status": PurchaseStatus.REJECTED}

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    normalized_email = normalize_email(str(user_data.email))
    username = (user_data.username or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9_]{3,30}", username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-30 chars and contain only lowercase letters, numbers, or underscore",
        )

    # Check if user exists
    existing = await db.users.find_one({"email": normalized_email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    username_taken = await db.users.find_one(
        {
            "$or": [
                {"username": username},
                {"lynkr_email": generate_lynkr_email(username)},
            ]
        },
        {"_id": 0, "id": 1},
    )
    if username_taken:
        raise HTTPException(status_code=400, detail="Username is already taken")
    
    verification_token = generate_verification_token()
    
    # Create user
    user = User(
        email=normalized_email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        username=username,
        phone=user_data.phone,
        dob=user_data.dob.isoformat(),
        gender=user_data.gender,
        role=user_data.role,
        lynkr_email="",
        verification_token=verification_token
    )
    user.lynkr_email = generate_lynkr_email(username)

    zoho_provisioned = await provision_zoho_mailbox_if_enabled(
        username=username,
        full_name=user.full_name,
        email_address=user.lynkr_email,
    )
    if ZOHO_MAIL_ENABLED and ZOHO_MAIL_REQUIRED_ON_SIGNUP and not zoho_provisioned:
        raise HTTPException(
            status_code=502,
            detail="Unable to provision Lynkr mailbox right now. Please try again.",
        )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Send verification email (non-blocking)
    asyncio.create_task(send_verification_email(user.email, verification_token, user.full_name))
    
    # Create token
    token = create_access_token({"sub": user.id, "role": user.role})
    
    return {
        "token": token,
        "user": UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            username=user.username,
            phone=user.phone,
            dob=user.dob,
            gender=user.gender,
            role=user.role,
            lynkr_email=user.lynkr_email,
            points=user.points,
            email_verified=user.email_verified,
            avatar=user.avatar,
            onboarding_complete=user.onboarding_complete,
            notification_preferences=user.notification_preferences,
            privacy_settings=user.privacy_settings
        )
    }

@api_router.get("/auth/verify-email")
async def verify_email(token: str):
    user = await db.users.find_one({"verification_token": token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Invalid verification token")
    
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {"email_verified": True, "verification_token": None}}
    )
    
    return {"success": True, "message": "Email verified successfully"}

@api_router.post("/auth/resend-verification")
async def resend_verification(user: User = Depends(get_current_user)):
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    verification_token = generate_verification_token()
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"verification_token": verification_token}}
    )
    
    asyncio.create_task(send_verification_email(user.email, verification_token, user.full_name))
    
    return {"success": True, "message": "Verification email sent"}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    normalized_email = normalize_email(str(login_data.email))
    user = await db.users.find_one({"email": normalized_email}, {"_id": 0})
    if not user:
        # Backward compatibility for older records with mixed-case email.
        user = await db.users.find_one(
            {"email": {"$regex": f"^{re.escape(normalized_email)}$", "$options": "i"}},
            {"_id": 0},
        )
    if not user or not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user['id'], "role": user['role']})
    
    return {
        "token": token,
        "user": UserResponse(
            id=user['id'],
            email=user['email'],
            full_name=user['full_name'],
            username=user.get('username'),
            phone=user['phone'],
            dob=user['dob'],
            gender=user['gender'],
            role=user['role'],
            lynkr_email=user['lynkr_email'],
            points=user['points'],
            email_verified=user.get('email_verified', False),
            avatar=user.get('avatar'),
            onboarding_complete=user.get('onboarding_complete', False),
            notification_preferences=user.get('notification_preferences', {}),
            privacy_settings=user.get('privacy_settings', {})
        )
    }

# ============ USER ENDPOINTS ============

@api_router.get("/user/me")
async def get_current_user_info(user: User = Depends(get_current_user)):
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        username=user.username,
        phone=user.phone,
        dob=user.dob,
        gender=user.gender,
        role=user.role,
        lynkr_email=user.lynkr_email,
        points=user.points,
        email_verified=user.email_verified,
        avatar=user.avatar,
        onboarding_complete=user.onboarding_complete,
        notification_preferences=user.notification_preferences,
        privacy_settings=user.privacy_settings
    )

@api_router.put("/user/profile")
async def update_profile(update: UserProfileUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if 'dob' in update_data:
        update_data['dob'] = update_data['dob'].isoformat()
    
    if update_data:
        await db.users.update_one(
            {"id": user.id},
            {"$set": update_data}
        )
    
    return {"success": True, "message": "Profile updated"}

@api_router.post("/user/change-password")
async def change_password(password_change: PasswordChange, user: User = Depends(get_current_user)):
    if not verify_password(password_change.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    new_hash = hash_password(password_change.new_password)
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"success": True, "message": "Password changed successfully"}

@api_router.put("/user/notification-preferences")
async def update_notification_preferences(prefs: NotificationPreferencesUpdate, user: User = Depends(get_current_user)):
    update_data = {f"notification_preferences.{k}": v for k, v in prefs.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"id": user.id},
            {"$set": update_data}
        )
    
    return {"success": True, "message": "Notification preferences updated"}

@api_router.put("/user/privacy-settings")
async def update_privacy_settings(settings: PrivacySettingsUpdate, user: User = Depends(get_current_user)):
    update_data = {f"privacy_settings.{k}": v for k, v in settings.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"id": user.id},
            {"$set": update_data}
        )
    
    return {"success": True, "message": "Privacy settings updated"}

@api_router.delete("/user/account")
async def delete_account(user: User = Depends(get_current_user)):
    # Delete user data
    await db.users.delete_one({"id": user.id})
    await db.purchases.delete_many({"user_id": user.id})
    await db.points_ledger.delete_many({"user_id": user.id})
    await db.chat_messages.delete_many({"user_id": user.id})
    
    return {"success": True, "message": "Account deleted"}

@api_router.post("/user/complete-onboarding")
async def complete_onboarding(user: User = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"onboarding_complete": True}}
    )
    return {"success": True}

@api_router.get("/user/dashboard")
async def get_dashboard(user: User = Depends(get_current_user)):
    # Get current month purchases
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    purchases = await db.purchases.find(
        {"user_id": user.id, "timestamp": {"$gte": month_start.isoformat()}},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate this month spending
    month_spending = sum(p['amount'] for p in purchases if p['status'] == PurchaseStatus.VERIFIED)
    
    # Get recent purchases
    recent = await db.purchases.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(5).to_list(5)
    
    now_iso = datetime.now(timezone.utc).isoformat()
    coupon_docs = await db.coupons.find(
        {
            "is_active": True,
            "expiry_date": {"$gt": now_iso},
            "$expr": {"$lt": ["$redeemed_count", "$total_quantity"]},
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(12).to_list(12)
    rewards = [
        {
            "id": c["id"],
            "name": c["title"],
            "points": c["points_cost"],
            "value": c["value"],
        }
        for c in coupon_docs
    ]
    
    return {
        "points": user.points,
        "month_spending": month_spending,
        "recent_purchases": [
            PurchaseResponse(
                id=p['id'],
                brand=p['brand'],
                order_id=p['order_id'],
                amount=p['amount'],
                status=p['status'],
                category=p.get('category'),
                timestamp=p['timestamp']
            ) for p in recent
        ],
        "available_rewards": rewards
    }

# ============ PURCHASES ENDPOINTS ============

@api_router.post("/purchases", response_model=PurchaseResponse)
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


@api_router.post("/user/raise-purchase")
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

    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
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

@api_router.get("/purchases")
async def get_purchases(user: User = Depends(get_current_user)):
    purchases = await db.purchases.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
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


@api_router.get("/user/raised-purchases")
async def get_raised_purchases(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.USER)
    purchases = await db.purchases.find(
        {"user_id": user.id, "submitted_by_user": True},
        {"_id": 0},
    ).sort("timestamp", -1).to_list(200)

    partner_ids = sorted({p.get("partner_id") for p in purchases if p.get("partner_id")})
    partner_map = {}
    if partner_ids:
        partners = await db.partners.find({"id": {"$in": partner_ids}}, {"_id": 0, "id": 1, "business_name": 1}).to_list(len(partner_ids))
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


@api_router.patch("/user/raised-purchases/{purchase_id}")
async def update_raised_purchase(
    purchase_id: str,
    payload: UserPurchaseUpdateRequest,
    user: User = Depends(get_current_user),
):
    await require_role(user, UserRole.USER)
    purchase = await db.purchases.find_one({"id": purchase_id, "user_id": user.id}, {"_id": 0})
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
        partner = await db.partners.find_one({"id": new_partner_id}, {"_id": 0, "business_name": 1})
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
    await db.purchases.update_one({"id": purchase_id}, {"$set": patch_data})

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
        await db.partner_orders.update_one({"purchase_id": purchase_id}, {"$set": partner_order_patch})

    return {
        "success": True,
        "purchase_id": purchase_id,
        "partner_name": partner_name,
        "edited_once": True,
    }


@api_router.get("/partners/active")
async def get_active_partners_for_users(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.USER)
    partners = await db.partners.find(
        {"status": {"$in": [PartnerStatus.ACTIVE, PartnerStatus.PILOT, PartnerStatus.PENDING]}},
        {"_id": 0, "id": 1, "business_name": 1, "category": 1, "status": 1},
    ).sort("business_name", 1).to_list(1000)
    return partners

# ============ AI INSIGHTS ENDPOINTS ============

@api_router.get("/ai/insights")
async def get_ai_insights(user: User = Depends(get_current_user)):
    # Get user purchases
    purchases = await db.purchases.find(
        {"user_id": user.id, "status": PurchaseStatus.VERIFIED},
        {"_id": 0}
    ).to_list(1000)
    
    if not purchases:
        return AIInsights(
            spending_by_category={},
            top_category="None",
            monthly_trend="No data yet",
            spending_persona="New User",
            insights=["Start shopping with your Lynkr email to see insights!"],
            recommendations=["Use your Lynkr email for all online purchases"]
        )
    
    # Prepare data for AI
    purchase_summary = []
    for p in purchases:
        purchase_summary.append({
            "brand": p['brand'],
            "amount": p['amount'],
            "category": p.get('category', 'Other'),
            "date": p['timestamp']
        })
    
    # Call Gemini AI for insights (if emergentintegrations is available)
    if EMERGENT_AVAILABLE and os.environ.get('EMERGENT_LLM_KEY'):
        try:
            chat = LlmChat(
                api_key=os.environ.get('EMERGENT_LLM_KEY'),
                session_id=f"insights-{user.id}",
                system_message="You are an AI shopping insights analyst. Analyze user spending patterns and provide clear, actionable insights in JSON format."
            )
            chat.with_model("gemini", "gemini-3-flash-preview")
            
            prompt = f"""Analyze these purchases and provide insights:
{json.dumps(purchase_summary, indent=2)}

Return a JSON object with:
1. spending_by_category: dict of category totals
2. top_category: string
3. monthly_trend: brief trend description
4. spending_persona: one of [Budget Conscious, Trend Shopper, Brand Loyal, Convenience First]
5. insights: array of 3 short human-readable insights
6. recommendations: array of 2 actionable tips

Keep insights friendly and non-technical."""
            
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            
            # Parse AI response
            ai_data = json.loads(response)
            return AIInsights(**ai_data)
        
        except Exception as e:
            logging.error(f"AI insights error: {e}")
            # Fallback to basic analysis below
    
    # Fallback to basic analysis (when emergentintegrations not available or fails)
    logging.info("Using fallback AI insights analysis")
    category_totals = {}
    for p in purchases:
        cat = p.get('category', 'Other')
        category_totals[cat] = category_totals.get(cat, 0) + p['amount']
    
    top_cat = max(category_totals.items(), key=lambda x: x[1])[0] if category_totals else "None"
    
    return AIInsights(
        spending_by_category=category_totals,
        top_category=top_cat,
        monthly_trend="Steady spending",
        spending_persona="Active Shopper",
        insights=[
            f"{top_cat} is your top category",
            f"You've made {len(purchases)} verified purchases",
            "Keep using your Lynkr email for more rewards"
        ],
        recommendations=[
            "Save points for higher value rewards",
            "Check partner exclusive offers"
        ]
    )

# ============ AI CHATBOT ENDPOINTS ============

def _get_chat_llm():
    """Use Gemini if GEMINI_API_KEY is set, else OpenAI. Avoids OpenAI quota errors when using Gemini."""
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if gemini_key:
        from app.ai.llm_client import GeminiClient
        model = os.environ.get("GEMINI_CHAT_MODEL", "gemini-2.0-flash").strip()
        return ("gemini", GeminiClient(api_key=gemini_key, model=model))
    return ("openai", None)


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, user: User = Depends(get_current_user)):
    # Get user context
    purchases = await db.purchases.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(20).to_list(20)
    
    # Get chat history
    chat_history = await db.chat_messages.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(10).to_list(10)
    chat_history.reverse()
    
    # Build context (system prompt)
    context = f"""You are Lynkr AI Assistant - a helpful, friendly shopping and rewards advisor.

User Info:
- Name: {user.full_name}
- Points: {user.points}
- Recent purchases: {len(purchases)}

Recent Purchases:
{json.dumps([{"brand": p['brand'], "amount": p['amount'], "status": p['status'], "date": p['timestamp']} for p in purchases[:5]], indent=2)}

Your capabilities:
1. Explain spending insights and patterns
2. Recommend best rewards to redeem
3. Answer questions about purchases and their status
4. Provide shopping tips and advice
5. Help with rewards redemption strategy

Be conversational, helpful, and concise. Use emojis sparingly."""
    
    llm_type, gemini_client = _get_chat_llm()
    assistant_message = None

    if llm_type == "gemini" and gemini_client:
        # Use Gemini only (no fallback to OpenAI to avoid quota errors)
        try:
            conv = []
            for msg in chat_history:
                conv.append(f"{msg['role'].upper()}: {msg['content']}")
            conv.append(f"USER: {request.message}")
            prompt = "\n\n".join(conv) if conv else request.message
            raw = await gemini_client.complete(
                prompt,
                system_prompt=context,
                max_tokens=500,
                temperature=0.7,
            )
            assistant_message = (raw if isinstance(raw, str) else str(raw)).strip()
        except Exception as e:
            logging.error("Gemini chat failed: %s", e)
            raise HTTPException(
                status_code=503,
                detail=f"Gemini chat failed: {str(e)}. Check GEMINI_API_KEY and try again.",
            )

    if llm_type == "openai":
        # Use OpenAI (only if key is set)
        if openai_client and os.environ.get("OPENAI_API_KEY"):
            messages = [{"role": "system", "content": context}]
            for msg in chat_history:
                messages.append({"role": msg['role'], "content": msg['content']})
            messages.append({"role": "user", "content": request.message})
            try:
                response = await openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    max_tokens=500,
                    temperature=0.7
                )
                assistant_message = response.choices[0].message.content
            except Exception as e:
                logging.error("Chat error: %s", e)
                raise HTTPException(status_code=500, detail=f"Chat service unavailable: {str(e)}")

    if not assistant_message:
        raise HTTPException(status_code=503, detail="No chat provider available. Set GEMINI_API_KEY or OPENAI_API_KEY.")

    # Save user message
    user_msg = ChatMessage(
        user_id=user.id,
        role="user",
        content=request.message
    )
    user_doc = user_msg.model_dump()
    user_doc['timestamp'] = user_doc['timestamp'].isoformat()
    await db.chat_messages.insert_one(user_doc)
    
    # Save assistant message
    assistant_msg = ChatMessage(
        user_id=user.id,
        role="assistant",
        content=assistant_message
    )
    assistant_doc = assistant_msg.model_dump()
    assistant_doc['timestamp'] = assistant_doc['timestamp'].isoformat()
    await db.chat_messages.insert_one(assistant_doc)
    
    return ChatResponse(
        id=assistant_msg.id,
        role="assistant",
        content=assistant_message,
        timestamp=assistant_msg.timestamp.isoformat()
    )

@api_router.get("/chat/history")
async def get_chat_history(user: User = Depends(get_current_user)):
    messages = await db.chat_messages.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    
    return [
        ChatResponse(
            id=msg['id'],
            role=msg['role'],
            content=msg['content'],
            timestamp=msg['timestamp']
        ) for msg in messages
    ]

@api_router.delete("/chat/history")
async def clear_chat_history(user: User = Depends(get_current_user)):
    await db.chat_messages.delete_many({"user_id": user.id})
    return {"success": True, "message": "Chat history cleared"}

# ============ POINTS & REWARDS ENDPOINTS ============

@api_router.get("/points/ledger")
async def get_points_ledger(user: User = Depends(get_current_user)):
    ledger = await db.points_ledger.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return ledger


@api_router.get("/points/leaderboard")
async def get_points_leaderboard(user: User = Depends(get_current_user)):
    top_users = await db.users.find(
        {"role": UserRole.USER},
        {"_id": 0, "id": 1, "full_name": 1, "email": 1, "points": 1}
    ).sort("points", -1).limit(20).to_list(20)

    if not top_users:
        return []

    user_ids = [u["id"] for u in top_users]
    redemption_counts = await db.redemptions.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
    ]).to_list(100)
    redemption_map = {r["_id"]: int(r["count"]) for r in redemption_counts}

    latest_ledger_entries = await db.points_ledger.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$sort": {"created_at": -1}},
        {"$group": {"_id": "$user_id", "entry": {"$first": "$$ROOT"}}},
    ]).to_list(100)
    ledger_map = {row["_id"]: row["entry"] for row in latest_ledger_entries}

    leaderboard = []
    for idx, u in enumerate(top_users, start=1):
        last_entry = ledger_map.get(u["id"], {})
        leaderboard.append({
            "rank": idx,
            "user_id": u["id"],
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


@api_router.post("/admin/coupons")
async def create_coupon(coupon_data: CouponCreate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    payload = coupon_data.model_dump()
    _validate_coupon_payload(payload)

    partner = await db.partners.find_one({"id": payload["partner_id"]}, {"_id": 0, "id": 1})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    exists = await db.coupons.find_one({"coupon_code": payload["coupon_code"]}, {"_id": 0, "id": 1})
    if exists:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(**payload)
    doc = coupon.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["expiry_date"] = coupon.expiry_date.isoformat()
    await db.coupons.insert_one(doc)
    return {"success": True, "coupon": doc}


@api_router.get("/admin/coupons")
async def get_admin_coupons(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    hydrated = await _hydrate_coupon_partners(coupons)
    return hydrated


@api_router.patch("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon_update: CouponUpdate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    updates = coupon_update.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    _validate_coupon_payload(updates)

    if updates.get("partner_id"):
        partner = await db.partners.find_one({"id": updates["partner_id"]}, {"_id": 0, "id": 1})
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")

    if updates.get("coupon_code"):
        existing = await db.coupons.find_one(
            {"coupon_code": updates["coupon_code"], "id": {"$ne": coupon_id}},
            {"_id": 0, "id": 1}
        )
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")

    if updates.get("expiry_date"):
        updates["expiry_date"] = updates["expiry_date"].isoformat()

    if updates.get("total_quantity") is not None:
        current = await db.coupons.find_one({"id": coupon_id}, {"_id": 0, "redeemed_count": 1})
        if not current:
            raise HTTPException(status_code=404, detail="Coupon not found")
        if updates["total_quantity"] < int(current.get("redeemed_count", 0)):
            raise HTTPException(status_code=400, detail="total_quantity cannot be lower than redeemed_count")

    result = await db.coupons.update_one({"id": coupon_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")

    coupon = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    hydrated = await _hydrate_coupon_partners([coupon])
    return {"success": True, "coupon": hydrated[0]}


@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"success": True}


@api_router.get("/coupons")
async def get_available_coupons(user: User = Depends(get_current_user)):
    now_iso = datetime.now(timezone.utc).isoformat()
    coupons = await db.coupons.find(
        {
            "is_active": True,
            "expiry_date": {"$gt": now_iso},
            "$expr": {"$lt": ["$redeemed_count", "$total_quantity"]},
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    hydrated = await _hydrate_coupon_partners(coupons)
    return hydrated


@api_router.get("/coupons/redemptions")
async def get_user_coupon_redemptions(user: User = Depends(get_current_user)):
    redemptions = await db.redemptions.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("redeemed_at", -1).to_list(200)

    if not redemptions:
        return []

    coupon_ids = sorted({r.get("coupon_id") for r in redemptions if r.get("coupon_id")})
    coupons = await db.coupons.find({"id": {"$in": coupon_ids}}, {"_id": 0}).to_list(len(coupon_ids))
    coupon_map = {c["id"]: c for c in coupons}

    partner_ids = sorted({c.get("partner_id") for c in coupons if c.get("partner_id")})
    partners = await db.partners.find({"id": {"$in": partner_ids}}, {"_id": 0}).to_list(len(partner_ids))
    partner_map = {p["id"]: p for p in partners}

    result = []
    for redemption in redemptions:
        coupon = coupon_map.get(redemption.get("coupon_id"), {})
        partner = partner_map.get(coupon.get("partner_id"), {})
        result.append({
            **redemption,
            "coupon_title": coupon.get("title"),
            "partner_name": partner.get("business_name"),
            "value_type": coupon.get("value_type"),
            "value": coupon.get("value"),
        })
    return result


@api_router.post("/coupons/{coupon_id}/redeem")
async def redeem_coupon(coupon_id: str, user: User = Depends(get_current_user)):
    now_iso = datetime.now(timezone.utc).isoformat()

    coupon = await db.coupons.find_one_and_update(
        {
            "id": coupon_id,
            "is_active": True,
            "expiry_date": {"$gt": now_iso},
            "$expr": {"$lt": ["$redeemed_count", "$total_quantity"]},
        },
        {"$inc": {"redeemed_count": 1}},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not coupon:
        raise HTTPException(status_code=400, detail="Coupon unavailable, expired, or out of stock")

    user_redemption_count = await db.redemptions.count_documents({"user_id": user.id, "coupon_id": coupon_id})
    user_limit = int(coupon.get("user_limit", 1))
    if user_redemption_count >= user_limit:
        await db.coupons.update_one({"id": coupon_id}, {"$inc": {"redeemed_count": -1}})
        raise HTTPException(status_code=400, detail="User redemption limit reached for this coupon")

    points_cost = int(coupon["points_cost"])
    updated_user = await db.users.find_one_and_update(
        {"id": user.id, "points": {"$gte": points_cost}},
        {"$inc": {"points": -points_cost}},
        projection={"_id": 0, "id": 1, "points": 1},
        return_document=ReturnDocument.AFTER,
    )
    if not updated_user:
        await db.coupons.update_one({"id": coupon_id}, {"$inc": {"redeemed_count": -1}})
        raise HTTPException(status_code=400, detail="Insufficient points")

    redemption = Redemption(
        user_id=user.id,
        coupon_id=coupon_id,
        coupon_code=str(coupon.get("coupon_code", "")),
        points_deducted=points_cost,
    )
    redemption_doc = redemption.model_dump()
    redemption_doc["redeemed_at"] = redemption.redeemed_at.isoformat()
    try:
        await db.redemptions.insert_one(redemption_doc)
    except DuplicateKeyError:
        await db.coupons.update_one({"id": coupon_id}, {"$inc": {"redeemed_count": -1}})
        await db.users.update_one({"id": user.id}, {"$inc": {"points": points_cost}})
        raise HTTPException(status_code=400, detail="Coupon already redeemed by this user")

    ledger_entry = PointsLedger(
        user_id=user.id,
        type="COUPON_REDEMPTION",
        amount=points_cost,
        description=f"Coupon redeemed: {coupon.get('title')} ({coupon.get('coupon_code')})",
        balance_after=int(updated_user["points"]),
    )
    ledger_doc = ledger_entry.model_dump()
    ledger_doc["created_at"] = ledger_entry.created_at.isoformat()
    await db.points_ledger.insert_one(ledger_doc)

    return {
        "success": True,
        "coupon_id": coupon_id,
        "coupon_code": coupon.get("coupon_code"),
        "points_deducted": points_cost,
        "new_balance": int(updated_user["points"]),
        "remaining_quantity": max(0, int(coupon.get("total_quantity", 0)) - int(coupon.get("redeemed_count", 0))),
    }

@api_router.post("/points/redeem")
async def redeem_points(reward_id: str, points: int, user: User = Depends(get_current_user)):
    if user.points < points:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    # Deduct points
    new_balance = user.points - points
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"points": new_balance}}
    )
    
    # Record in ledger
    ledger_entry = PointsLedger(
        user_id=user.id,
        type="DEBIT",
        amount=points,
        description=f"Redeemed reward ID: {reward_id}",
        balance_after=new_balance
    )
    
    doc = ledger_entry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.points_ledger.insert_one(doc)
    
    # Mock coupon code
    return {
        "success": True,
        "new_balance": new_balance,
        "coupon_code": f"LYNKR-{uuid.uuid4().hex[:8].upper()}",
        "message": "Reward redeemed successfully! Check your email for the coupon code."
    }

# ============ PARTNER ENDPOINTS ============

@api_router.post("/partner/auth/login")
async def partner_email_password_login(login_data: UserLogin):
    normalized_email = normalize_email(str(login_data.email))
    # Find partner user
    user = await db.users.find_one(
        {"email": normalized_email, "role": UserRole.PARTNER},
        {"_id": 0}
    )
    if not user:
        user = await db.users.find_one(
            {
                "role": UserRole.PARTNER,
                "email": {"$regex": f"^{re.escape(normalized_email)}$", "$options": "i"},
            },
            {"_id": 0},
        )
    
    if not user or not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Get partner info
    partner_id = user.get('partner_id')
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    # Create token
    token = create_access_token({"sub": user['id'], "role": user['role']})
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "full_name": user['full_name'],
            "role": user['role'],
            "must_change_password": partner.get('must_change_password', False),
            "partner_id": partner_id
        }
    }

@api_router.post("/partner/first-login-password-change")
async def partner_first_login_password_change(new_password: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    
    # Get partner info
    user_data = await db.users.find_one({"id": user.id}, {"_id": 0})
    partner_id = user_data.get('partner_id')
    
    if not partner_id:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    
    if not partner.get('must_change_password'):
        raise HTTPException(status_code=400, detail="Password already changed")
    
    # Update password
    new_hash = hash_password(new_password)
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"password_hash": new_hash}}
    )
    await db.partners.update_one(
        {"id": partner_id},
        {"$set": {"password_hash": new_hash, "must_change_password": False, "temp_password": None}}
    )
    
    return {"success": True, "message": "Password changed successfully"}

@api_router.get("/partner/dashboard")
async def get_partner_dashboard(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    
    # Get partner info
    user_data = await db.users.find_one({"id": user.id}, {"_id": 0})
    partner_id = user_data.get('partner_id')
    
    if not partner_id:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    
    # Get partner orders
    orders = await db.partner_orders.find({"partner_id": partner_id}, {"_id": 0}).to_list(1000)
    
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

@api_router.get("/partner/orders")
async def get_partner_orders(status: Optional[str] = None, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    
    partner_id = await _get_partner_id_for_user(user.id)
    
    query = {"partner_id": partner_id}
    if status:
        query["status"] = status
    
    orders = await db.partner_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
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


@api_router.get("/partner/purchases")
async def get_partner_purchases(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)

    query = {"partner_id": partner_id, "status": {"$in": [PurchaseStatus.PENDING, PurchaseStatus.VERIFIED]}}
    purchases = await db.purchases.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)

    user_ids = sorted({p.get("user_id") for p in purchases if p.get("user_id")})
    user_map = {}
    if user_ids:
        users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "lynkr_email": 1}).to_list(len(user_ids))
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


@api_router.post("/partner/verify-purchase")
async def partner_verify_purchase(payload: PartnerVerifyPurchaseRequest, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    partner_id = await _get_partner_id_for_user(user.id)

    action = (payload.action or "").strip().upper()
    if action not in {"VERIFY", "REJECT"}:
        raise HTTPException(status_code=400, detail="action must be VERIFY or REJECT")

    purchase = await db.purchases.find_one({"id": payload.purchase_id}, {"_id": 0})
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    if purchase.get("partner_id") != partner_id:
        raise HTTPException(status_code=403, detail="You can only verify your own purchases")

    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0, "business_name": 1})
    partner_name = partner.get("business_name", "Partner") if partner else "Partner"
    result = await _set_purchase_verification_status(
        purchase=purchase,
        action=action,
        verification_source=VerificationSource.PARTNER,
        credit_description=f"Partner verified purchase: {partner_name}",
    )

    order_status = "ACKNOWLEDGED" if action == "VERIFY" else "DISPUTED"
    await db.partner_orders.update_one(
        {"purchase_id": payload.purchase_id, "partner_id": partner_id},
        {"$set": {"status": order_status, "acknowledged_at": datetime.now(timezone.utc).isoformat()}},
    )
    return result

@api_router.post("/partner/acknowledge-order/{order_id}")
async def acknowledge_order(order_id: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    
    partner_id = await _get_partner_id_for_user(user.id)
    
    # Verify order belongs to this partner
    order = await db.partner_orders.find_one({"id": order_id, "partner_id": partner_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['status'] != 'PENDING':
        raise HTTPException(status_code=400, detail="Order already processed")
    
    # Acknowledge order
    await db.partner_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "ACKNOWLEDGED", "acknowledged_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    purchase = await db.purchases.find_one({"id": order['purchase_id']}, {"_id": 0})
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0, "business_name": 1})
    partner_name = partner.get("business_name", purchase.get("brand", "Partner")) if partner else purchase.get("brand", "Partner")
    await _set_purchase_verification_status(
        purchase=purchase,
        action="VERIFY",
        verification_source=VerificationSource.PARTNER,
        credit_description=f"Partner verified purchase: {partner_name}",
    )

    return {"success": True, "message": "Order acknowledged and points credited"}

# ============ ADMIN ENDPOINTS ============

@api_router.get("/admin/users")
async def get_all_users(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    
    users = await db.users.find({"role": UserRole.USER}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users


@api_router.patch("/admin/users/{user_id}/points")
async def update_user_points(user_id: str, payload: UserPointsUpdate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    op = (payload.operation or "").lower().strip()
    if op not in {"add", "subtract", "set"}:
        raise HTTPException(status_code=400, detail="operation must be one of: add, subtract, set")
    if payload.points < 0:
        raise HTTPException(status_code=400, detail="points must be >= 0")

    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    current_points = int(target.get("points", 0))
    if op == "add":
        new_points = current_points + int(payload.points)
        delta = int(payload.points)
    elif op == "subtract":
        if current_points < int(payload.points):
            raise HTTPException(status_code=400, detail="Insufficient points to subtract")
        new_points = current_points - int(payload.points)
        delta = -int(payload.points)
    else:  # set
        new_points = int(payload.points)
        delta = new_points - current_points

    await db.users.update_one({"id": user_id}, {"$set": {"points": new_points}})

    if delta != 0:
        ledger_type = "ADMIN_CREDIT" if delta > 0 else "ADMIN_DEBIT"
        reason = payload.reason or f"Admin points update ({op})"
        ledger_entry = PointsLedger(
            user_id=user_id,
            type=ledger_type,
            amount=abs(delta),
            description=reason,
            balance_after=new_points,
        )
        ledger_doc = ledger_entry.model_dump()
        ledger_doc["created_at"] = ledger_entry.created_at.isoformat()
        await db.points_ledger.insert_one(ledger_doc)

    return {
        "success": True,
        "user_id": user_id,
        "username": target.get("username"),
        "old_points": current_points,
        "new_points": new_points,
        "delta": delta,
    }


@api_router.patch("/admin/users/by-username/{username}/points")
async def update_user_points_by_username(username: str, payload: UserPointsUpdate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)

    op = (payload.operation or "").lower().strip()
    if op not in {"add", "subtract", "set"}:
        raise HTTPException(status_code=400, detail="operation must be one of: add, subtract, set")
    if payload.points < 0:
        raise HTTPException(status_code=400, detail="points must be >= 0")

    normalized_username = (username or "").strip().lower()
    target = await db.users.find_one({"username": normalized_username}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found for username")

    current_points = int(target.get("points", 0))
    if op == "add":
        new_points = current_points + int(payload.points)
        delta = int(payload.points)
    elif op == "subtract":
        if current_points < int(payload.points):
            raise HTTPException(status_code=400, detail="Insufficient points to subtract")
        new_points = current_points - int(payload.points)
        delta = -int(payload.points)
    else:  # set
        new_points = int(payload.points)
        delta = new_points - current_points

    await db.users.update_one({"id": target["id"]}, {"$set": {"points": new_points}})

    if delta != 0:
        ledger_type = "ADMIN_CREDIT" if delta > 0 else "ADMIN_DEBIT"
        reason = payload.reason or f"Admin points update ({op})"
        ledger_entry = PointsLedger(
            user_id=target["id"],
            type=ledger_type,
            amount=abs(delta),
            description=reason,
            balance_after=new_points,
        )
        ledger_doc = ledger_entry.model_dump()
        ledger_doc["created_at"] = ledger_entry.created_at.isoformat()
        await db.points_ledger.insert_one(ledger_doc)

    return {
        "success": True,
        "user_id": target["id"],
        "username": target.get("username"),
        "old_points": current_points,
        "new_points": new_points,
        "delta": delta,
    }

@api_router.get("/admin/partners")
async def get_all_partners(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    
    partners = await db.partners.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return partners

@api_router.get("/admin/purchases")
async def get_all_purchases(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    
    purchases = await db.purchases.find({}, {"_id": 0}).sort("detected_at", -1).to_list(1000)
    return purchases

@api_router.post("/admin/verify-purchase/{purchase_id}")
async def verify_purchase(purchase_id: str, action: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    
    if action not in ["VERIFY", "REJECT"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    purchase = await db.purchases.find_one({"id": purchase_id}, {"_id": 0})
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    result = await _set_purchase_verification_status(
        purchase=purchase,
        action=action,
        verification_source=VerificationSource.ADMIN,
        credit_description=f"Purchase verified: {purchase.get('brand', 'Partner')} - ₹{purchase.get('amount')}",
    )
    return result

@api_router.post("/admin/create-partner")
async def create_partner(partner_data: PartnerCreate, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    
    # Check if partner exists
    existing = await db.partners.find_one({"contact_email": partner_data.contact_email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Partner email already registered")
    
    # Generate random password
    temp_password = generate_random_password()
    
    # Create partner
    partner = Partner(
        business_name=partner_data.business_name,
        category=partner_data.category,
        website=partner_data.website,
        contact_email=partner_data.contact_email,
        contact_person=partner_data.contact_person,
        password_hash=hash_password(temp_password),
        temp_password=temp_password,
        must_change_password=True,
        status=PartnerStatus.PENDING
    )
    
    doc = partner.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.partners.insert_one(doc)
    
    # Create user account for partner login
    user_account = User(
        email=partner_data.contact_email,
        password_hash=hash_password(temp_password),
        full_name=partner_data.contact_person or partner_data.business_name,
        phone="",
        dob=datetime.now().date().isoformat(),
        gender="",
        role=UserRole.PARTNER,
        lynkr_email="",  # Partners don't get Lynkr email
        email_verified=True
    )
    
    user_doc = user_account.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['partner_id'] = partner.id
    await db.users.insert_one(user_doc)
    
    return {
        "success": True,
        "partner_id": partner.id,
        "email": partner_data.contact_email,
        "temp_password": temp_password,
        "message": "Partner created successfully. Share the credentials with the partner."
    }

@api_router.post("/admin/update-partner-status/{partner_id}")
async def update_partner_status(partner_id: str, new_status: str, user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    
    if new_status not in [PartnerStatus.PENDING, PartnerStatus.PILOT, PartnerStatus.ACTIVE]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.partners.update_one(
        {"id": partner_id},
        {"$set": {"status": new_status}}
    )
    
    return {"success": True}

# ============ SURVEY ENDPOINTS ============

@api_router.post("/survey/user")
async def submit_user_survey(
    shopping_habits: str,
    reward_preferences: str,
    trust_concerns: str,
    user: User = Depends(get_current_user)
):
    survey = UserSurvey(
        user_id=user.id,
        shopping_habits=shopping_habits,
        reward_preferences=reward_preferences,
        trust_concerns=trust_concerns
    )
    
    doc = survey.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.user_surveys.insert_one(doc)
    
    return {"success": True}

@api_router.post("/survey/partner")
async def submit_partner_survey(
    willingness_to_pilot: str,
    commission_expectations: str,
    feedback: str,
    user: User = Depends(get_current_user)
):
    await require_role(user, UserRole.PARTNER)
    
    user_data = await db.users.find_one({"id": user.id}, {"_id": 0})
    partner_id = user_data.get('partner_id')
    
    survey = PartnerSurvey(
        partner_id=partner_id,
        willingness_to_pilot=willingness_to_pilot,
        commission_expectations=commission_expectations,
        feedback=feedback
    )
    
    doc = survey.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.partner_surveys.insert_one(doc)
    
    return {"success": True}

# ============ MOCK EMAIL INGESTION ============

@api_router.post("/mock/ingest-email")
async def mock_email_ingestion(
    lynkr_email: str,
    brand: str,
    order_id: str,
    amount: float
):
    """Mock endpoint to simulate email ingestion service"""
    # Find user by lynkr_email
    user = await db.users.find_one({"lynkr_email": lynkr_email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find partner by brand name (simplified - in real app, would be more sophisticated)
    partner = await db.partners.find_one({"business_name": {"$regex": brand, "$options": "i"}}, {"_id": 0})

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

# ============ AI LAYER (production-grade pipeline) ============
# Input: canonical facts only. No raw payload parsing. No financial logic in AI.

_ai_pipeline = None

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

@api_router.post("/ai/process-facts")
async def ai_process_facts(facts: List[dict], user: User = Depends(get_current_user)):
    """Process canonical facts through the AI pipeline. Returns insights and optional explanations/recommendations. No financial operations."""
    try:
        from app.schemas.canonical_fact import CanonicalFact
        canonical = [CanonicalFact.model_validate(f) for f in facts]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid canonical fact format: {e}")
    pipeline = _get_ai_pipeline()
    result = await pipeline.run(canonical)
    return {
        "insights": [i.model_dump() for i in result.insights],
        "explanations": {k: v.model_dump() for k, v in result.explanations.items()},
        "recommendations": {k: v.model_dump() for k, v in result.recommendations.items()},
        "deterministic_only": result.deterministic_only,
    }

class RecordResolutionBody(BaseModel):
    insight_id: str
    summary: str
    outcome: str
    user_action_taken: Optional[str] = None

@api_router.post("/ai/record-resolution")
async def ai_record_resolution(body: RecordResolutionBody, user: User = Depends(get_current_user)):
    """Record that an insight was resolved; updates memory only. No financial data stored."""
    pipeline = _get_ai_pipeline()
    await pipeline.record_resolution(
        insight_id=body.insight_id,
        user_id=user.id,
        summary=body.summary,
        outcome=body.outcome,
        user_action_taken=body.user_action_taken,
    )
    return {"success": True}

# Include router
app.include_router(api_router)

# Custom 404 handler for API routes
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail if exc.status_code != 404 else "API endpoint not found. Check /api/docs for available endpoints.",
                "path": request.url.path,
                "method": request.method
            }
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_indexes():
    async def create_index_safe(collection, keys, **kwargs):
        try:
            await collection.create_index(keys, **kwargs)
        except OperationFailure as e:
            # If an index already exists with same autogenerated name but different options,
            # keep existing index and continue startup to avoid taking API down.
            if getattr(e, "code", None) in (85, 86):
                logger.warning("Index conflict skipped for %s: %s", keys, e)
            else:
                raise

    await create_index_safe(db.users, [("username", 1)], unique=True, sparse=True)
    await create_index_safe(
        db.users,
        [("lynkr_email", 1)],
        unique=True,
        partialFilterExpression={"role": UserRole.USER},
    )
    await create_index_safe(db.coupons, [("expiry_date", 1)])
    await create_index_safe(db.coupons, [("partner_id", 1)])
    await create_index_safe(db.coupons, [("is_active", 1)])
    await create_index_safe(db.coupons, [("coupon_code", 1)], unique=True)
    await create_index_safe(db.redemptions, [("coupon_id", 1)])
    await create_index_safe(db.redemptions, [("user_id", 1)])
    await create_index_safe(db.redemptions, [("user_id", 1), ("coupon_id", 1)], unique=True)
    await create_index_safe(db.purchases, [("user_id", 1), ("timestamp", -1)])
    await create_index_safe(db.purchases, [("partner_id", 1), ("status", 1), ("timestamp", -1)])
    await create_index_safe(db.partner_orders, [("partner_id", 1), ("status", 1), ("created_at", -1)])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
