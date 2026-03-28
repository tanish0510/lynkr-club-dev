"""AI spending insights."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['ai'])

@router.get("/ai/insights")
async def get_ai_insights(user: User = Depends(get_current_user)):
    # Get user purchases
    purchases = await db.purchases.find_by_user_verified(user.id)
    
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
            
            # Parse AI response (ensure top_category is never None)
            ai_data = json.loads(response)
            if ai_data.get("top_category") is None:
                ai_data["top_category"] = "Other"
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
    
    top_cat = max(category_totals.items(), key=lambda x: x[1])[0] if category_totals else "Other"
    if top_cat is None:
        top_cat = "Other"

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
