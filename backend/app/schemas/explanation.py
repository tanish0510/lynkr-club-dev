"""
Explanation – output of the reasoning agent (probabilistic plane).
Structured; no DB writes, no financial operations.
"""

from pydantic import BaseModel, Field


class Explanation(BaseModel):
    """LLM-generated explanation with explicit uncertainty."""

    what: str = Field(..., description="What happened / what this is")
    why: str = Field(..., description="Why it matters")
    impact: str = Field(..., description="Impact on user")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Explanation confidence")

    class Config:
        frozen = True
