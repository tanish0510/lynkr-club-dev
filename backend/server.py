from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date
from passlib.context import CryptContext
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import resend
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
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
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# OpenAI Configuration
openai_client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserRole:
    USER = "USER"
    PARTNER = "PARTNER"
    ADMIN = "ADMIN"

class PurchaseStatus:
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

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
    order_id: str
    amount: float
    status: str = PurchaseStatus.PENDING
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
    amount: float
    status: str
    category: Optional[str]
    timestamp: str

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

# Partner Models
class PartnerSignup(BaseModel):
    business_name: str
    category: str
    website: str
    monthly_orders: int
    commission_preference: str
    contact_email: EmailStr
    password: str

class Partner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_name: str
    category: str
    website: str
    monthly_orders: int
    commission_preference: str
    contact_email: EmailStr
    password_hash: str
    status: str = PartnerStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PartnerResponse(BaseModel):
    id: str
    business_name: str
    category: str
    status: str
    monthly_orders: int

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

def generate_lynkr_email(user_id: str) -> str:
    short_id = user_id[:8]
    return f"user{short_id}@lynkr.one"

def generate_verification_token() -> str:
    return str(uuid.uuid4())

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

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    verification_token = generate_verification_token()
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        phone=user_data.phone,
        dob=user_data.dob.isoformat(),
        gender=user_data.gender,
        role=user_data.role,
        lynkr_email="",
        verification_token=verification_token
    )
    user.lynkr_email = generate_lynkr_email(user.id)
    
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
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user['id'], "role": user['role']})
    
    return {
        "token": token,
        "user": UserResponse(
            id=user['id'],
            email=user['email'],
            full_name=user['full_name'],
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
    
    # Get available rewards (mocked)
    rewards = [
        {"id": "1", "name": "Amazon ₹500 Gift Card", "points": 500, "value": "500"},
        {"id": "2", "name": "Flipkart ₹1000 Gift Card", "points": 950, "value": "1000"},
        {"id": "3", "name": "Myntra ₹250 Gift Card", "points": 250, "value": "250"}
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

# Continue with rest of endpoints...
