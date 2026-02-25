"""
Recommendation engine – convert Explanation into safe advisory actions.
No enforcement. Never modifies ledger or cashback.
"""

from __future__ import annotations

import logging
from typing import List

from app.schemas.explanation import Explanation
from app.schemas.recommendation import Recommendation

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Turns explanation into recommended_actions / avoid_actions / risk_score.
    AI suggestions never directly modify financial state.
    """

    def recommend(self, explanation: Explanation) -> Recommendation:
        """
        Produce safe advisory from explanation. No side effects.
        """
        recommended: List[str] = []
        avoid: List[str] = []
        if explanation.confidence >= 0.6:
            recommended = [
                "Review your recent purchases in the dashboard.",
                "Use your Lynkr email for future orders to keep earning points.",
            ]
        if explanation.confidence < 0.5:
            avoid = ["Making decisions based only on this insight until more data is available."]
        risk = 0.2 if explanation.confidence >= 0.7 else 0.5
        return Recommendation(
            recommended_actions=recommended,
            avoid_actions=avoid,
            risk_score=min(1.0, risk + (1.0 - explanation.confidence) * 0.3),
            confidence=explanation.confidence,
        )
