"""
Signal – output of intent classification. No DB writes, no financial side effects.
"""

from pydantic import BaseModel, Field
from typing import List


class Signal(BaseModel):
    """Structured signal from intent classifier."""

    signal_id: str = Field(..., description="Unique signal id")
    intent: str = Field(..., description="Classified intent label")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Classification confidence")
    fact_ids: List[str] = Field(default_factory=list, description="Source fact ids")
    user_id: str = Field(..., description="User this signal belongs to")

    class Config:
        frozen = True
