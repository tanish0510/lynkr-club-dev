"""
Recommendation – safe advisory from recommendation engine.
Never enforces; never modifies ledger or cashback.
"""

from pydantic import BaseModel, Field
from typing import List


class Recommendation(BaseModel):
    """Advisory actions only; no enforcement."""

    recommended_actions: List[str] = Field(default_factory=list)
    avoid_actions: List[str] = Field(default_factory=list)
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Perceived risk of inaction")
    confidence: float = Field(..., ge=0.0, le=1.0)

    class Config:
        frozen = True
