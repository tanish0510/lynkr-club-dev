from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

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
    role: str = UserRole.USER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    role: str
    lynkr_email: str
    email_status: str = "ACTIVE"
    points: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    onboarding_complete: bool = False

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    lynkr_email: str
    points: int
    onboarding_complete: bool

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
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        lynkr_email=""
    )
    user.lynkr_email = generate_lynkr_email(user.id)
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Create token
    token = create_access_token({"sub": user.id, "role": user.role})
    
    return {
        "token": token,
        "user": UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            lynkr_email=user.lynkr_email,
            points=user.points,
            onboarding_complete=user.onboarding_complete
        )
    }

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
            role=user['role'],
            lynkr_email=user['lynkr_email'],
            points=user['points'],
            onboarding_complete=user.get('onboarding_complete', False)
        )
    }

# ============ USER ENDPOINTS ============

@api_router.get("/user/me")
async def get_current_user_info(user: User = Depends(get_current_user)):
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        lynkr_email=user.lynkr_email,
        points=user.points,
        onboarding_complete=user.onboarding_complete
    )

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
        amount=purchase.amount,
        status=purchase.status,
        category=purchase.category,
        timestamp=purchase.timestamp.isoformat()
    )

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
            amount=p['amount'],
            status=p['status'],
            category=p.get('category'),
            timestamp=p['timestamp']
        ) for p in purchases
    ]

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
    
    # Call Gemini AI for insights
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
        # Fallback to basic analysis
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

# ============ POINTS & REWARDS ENDPOINTS ============

@api_router.get("/points/ledger")
async def get_points_ledger(user: User = Depends(get_current_user)):
    ledger = await db.points_ledger.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return ledger

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

@api_router.post("/partner/signup")
async def partner_signup(partner_data: PartnerSignup):
    existing = await db.partners.find_one({"contact_email": partner_data.contact_email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    partner = Partner(
        business_name=partner_data.business_name,
        category=partner_data.category,
        website=partner_data.website,
        monthly_orders=partner_data.monthly_orders,
        commission_preference=partner_data.commission_preference,
        contact_email=partner_data.contact_email,
        password_hash=hash_password(partner_data.password),
        status=PartnerStatus.PENDING
    )
    
    doc = partner.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.partners.insert_one(doc)
    
    # Also create a user account for partner login
    user = User(
        email=partner_data.contact_email,
        password_hash=hash_password(partner_data.password),
        role=UserRole.PARTNER,
        lynkr_email=f"partner{partner.id[:8]}@lynkr.one"
    )
    
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['partner_id'] = partner.id
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user.id, "role": user.role})
    
    return {
        "token": token,
        "partner": PartnerResponse(
            id=partner.id,
            business_name=partner.business_name,
            category=partner.category,
            status=partner.status,
            monthly_orders=partner.monthly_orders
        )
    }

@api_router.get("/partner/dashboard")
async def get_partner_dashboard(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.PARTNER)
    
    # Get partner info
    user_data = await db.users.find_one({"id": user.id}, {"_id": 0})
    partner_id = user_data.get('partner_id')
    
    if not partner_id:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    
    # Mock metrics
    return {
        "partner_info": partner,
        "lynkr_users": 1247,
        "detected_purchases": 89,
        "verified_purchases": 67,
        "monthly_summary": {
            "total_orders": 67,
            "total_value": 45300,
            "avg_order_value": 676
        }
    }

# ============ ADMIN ENDPOINTS ============

@api_router.get("/admin/users")
async def get_all_users(user: User = Depends(get_current_user)):
    await require_role(user, UserRole.ADMIN)
    
    users = await db.users.find({"role": UserRole.USER}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

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
    
    new_status = PurchaseStatus.VERIFIED if action == "VERIFY" else PurchaseStatus.REJECTED
    
    await db.purchases.update_one(
        {"id": purchase_id},
        {"$set": {"status": new_status, "verified_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # If verified, credit points
    if action == "VERIFY":
        points_to_credit = int(purchase['amount'] * 0.01)  # 1% cashback
        
        # Update user points
        user_data = await db.users.find_one({"id": purchase['user_id']}, {"_id": 0})
        new_balance = user_data['points'] + points_to_credit
        
        await db.users.update_one(
            {"id": purchase['user_id']},
            {"$set": {"points": new_balance}}
        )
        
        # Record in ledger
        ledger_entry = PointsLedger(
            user_id=purchase['user_id'],
            type="CREDIT",
            amount=points_to_credit,
            description=f"Purchase verified: {purchase['brand']} - ₹{purchase['amount']}",
            balance_after=new_balance
        )
        
        doc = ledger_entry.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.points_ledger.insert_one(doc)
    
    return {"success": True, "new_status": new_status}

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
    
    # Create purchase
    purchase = Purchase(
        user_id=user['id'],
        brand=brand,
        order_id=order_id,
        amount=amount,
        status=PurchaseStatus.PENDING,
        category=SpendingCategory.OTHER
    )
    
    doc = purchase.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    doc['detected_at'] = doc['detected_at'].isoformat()
    await db.purchases.insert_one(doc)
    
    return {"success": True, "purchase_id": purchase.id}

# Include router
app.include_router(api_router)

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()