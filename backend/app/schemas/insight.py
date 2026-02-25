"""
Insight – output of the deterministic orchestrator (control plane).
Pure routing decision; no LLM calls inside.
"""

from pydantic import BaseModel, Field
from typing import List


class Insight(BaseModel):
    """Orchestrator decision: what to do with the signal."""

    insight_id: str = Field(..., description="Unique insight id")
    type: str = Field(..., description="e.g. direct_insight, trigger_reasoning")
    priority: str = Field(..., description="e.g. low, medium, high")
    state: str = Field(..., description="e.g. pending, resolved")
    signal_refs: List[str] = Field(default_factory=list, description="Source signal ids")
    user_id: str = Field(..., description="User this insight belongs to")

    class Config:
        frozen = True
