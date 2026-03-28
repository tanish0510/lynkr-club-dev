"""Modular API routers."""
from fastapi import APIRouter

from app.api.routes import (
    admin,
    ai_facts,
    auth,
    catalog,
    chat,
    coupons,
    dynamic_coupons,
    insights,
    mock,
    partner_portal,
    partners,
    payments,
    points,
    referrals,
    root,
    setup,
    surveys,
    users,
)

api_router = APIRouter(prefix="/api")

for mod in (
    root,
    auth,
    users,
    payments,
    partners,
    insights,
    chat,
    points,
    coupons,
    partner_portal,
    catalog,
    setup,
    admin,
    surveys,
    mock,
    ai_facts,
    referrals,
    dynamic_coupons,
):
    api_router.include_router(mod.router)

__all__ = ["api_router"]
