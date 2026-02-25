"""
Reasoning agent – probabilistic plane. Triggered only by orchestrator.
Fetches bounded context, calls LLM via wrapper, returns structured Explanation.
No DB writes. No financial operations. Handles LLM failure gracefully.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from app.schemas.insight import Insight
from app.schemas.explanation import Explanation
from app.ai.llm_client import LLMClientInterface

logger = logging.getLogger(__name__)


# Default fallback when LLM fails
def _fallback_explanation(insight: Insight) -> Explanation:
    return Explanation(
        what="We noticed activity that may be worth a look.",
        why="Automated insight from your shopping signals.",
        impact="No immediate impact; review when convenient.",
        confidence=0.3,
    )


class ReasoningAgent:
    """
    Called only by orchestrator. Uses LLM to produce Explanation.
    Always returns structured Explanation; on failure returns low-confidence fallback.
    """

    def __init__(
        self,
        llm_client: LLMClientInterface,
        context_fetcher: Optional[Any] = None,
        context_days: int = 30,
    ):
        self._llm = llm_client
        self._context_fetcher = context_fetcher  # Optional: (user_id, days) -> summary dict
        self._context_days = context_days

    async def explain(self, insight: Insight, context_summary: Optional[Dict[str, Any]] = None) -> Explanation:
        """
        Generate structured explanation for this insight.
        context_summary: optional bounded summary (e.g. last 30 days); never raw transactions.
        """
        if context_summary is None and self._context_fetcher and insight.user_id:
            try:
                context_summary = await self._context_fetcher(insight.user_id, self._context_days)
            except Exception as e:
                logger.warning("Context fetch failed for reasoning: %s", e)
                context_summary = {}

        prompt = self._build_prompt(insight, context_summary or {})
        system = (
            "You are a concise shopping insights assistant. "
            "Respond with JSON only: {\"what\": \"...\", \"why\": \"...\", \"impact\": \"...\", \"confidence\": 0.0-1.0}. "
            "Be brief. confidence should reflect your certainty."
        )
        try:
            raw = await self._llm.complete(
                prompt,
                system_prompt=system,
                response_schema=Explanation,
                max_tokens=256,
                temperature=0.2,
            )
            if isinstance(raw, Explanation):
                return raw
            # If raw string, try parse
            import json
            data = json.loads(str(raw))
            return Explanation.model_validate(data)
        except Exception as e:
            logger.warning("Reasoning agent LLM failed: %s", e)
            return _fallback_explanation(insight)

    def _build_prompt(self, insight: Insight, context: Dict[str, Any]) -> str:
        parts = [
            f"Insight: type={insight.type}, priority={insight.priority}, signal_refs={insight.signal_refs}.",
        ]
        if context:
            parts.append(f"User context (summary only): {context}")
        parts.append("Provide: what happened, why it matters, impact on user, and confidence 0-1.")
        return " ".join(parts)
