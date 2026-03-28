"""Surveys."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['survey'])

@router.post("/survey/user")
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

@router.post("/survey/partner")
async def submit_partner_survey(
    willingness_to_pilot: str,
    commission_expectations: str,
    feedback: str,
    user: User = Depends(get_current_user)
):
    await require_role(user, UserRole.PARTNER)
    
    user_data = await db.users.get_by_id(user.id)
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
