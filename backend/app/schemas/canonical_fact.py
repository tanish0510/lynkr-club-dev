"""
Canonical fact – the only input contract to the AI layer.
AI must NEVER parse raw payloads; callers must normalize to this schema.
"""

from pydantic import BaseModel, Field
from typing import Literal


class CanonicalFact(BaseModel):
    """Normalized fact; only this type is accepted by the AI layer."""

    fact_id: str = Field(..., description="Unique fact identifier")
    user_id: str = Field(..., description="User this fact belongs to")
    merchant: str = Field(..., description="Merchant/brand name")
    event_type: str = Field(
        ...,
        description="e.g. order_created, order_shipped, refund_issued",
    )
    amount: float = Field(..., ge=0, description="Amount in currency units")
    currency: str = Field(default="INR", description="ISO currency code")
    timestamp: str = Field(..., description="ISO8601 timestamp")

    class Config:
        frozen = True
