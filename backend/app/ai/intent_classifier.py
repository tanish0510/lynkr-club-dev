"""
Intent classification engine – canonical fact → Signal.
Rule-based first, LLM fallback. No DB writes, no financial side effects.
Fully unit-testable without LLM (rules only).
"""

from __future__ import annotations

import logging
import os
import uuid
from typing import List, Optional

from app.schemas.canonical_fact import CanonicalFact
from app.schemas.signal import Signal
from app.ai.llm_client import LLMClientInterface

logger = logging.getLogger(__name__)

# Rule-based intent labels (deterministic)
INTENT_ORDER_CREATED = "order_created"
INTENT_HIGH_VALUE = "high_value_purchase"
INTENT_FREQUENT_MERCHANT = "frequent_merchant"
INTENT_UNKNOWN = "unknown"

# Thresholds for rules (no AI)
HIGH_VALUE_THRESHOLD_INR = 5000.0
FREQUENT_MERCHANT_MIN_COUNT = 3  # Used when context passed; otherwise rule skips


def _rule_based_classify(fact: CanonicalFact) -> tuple[str, float]:
    """
    Pure deterministic classification. Returns (intent, confidence).
    Unit-testable without any LLM.
    """
    event = (fact.event_type or "").strip().lower()
    amount = fact.amount or 0
    currency = fact.currency or "INR"

    if event == "order_created":
        if amount >= HIGH_VALUE_THRESHOLD_INR and currency == "INR":
            return INTENT_HIGH_VALUE, 0.95
        return INTENT_ORDER_CREATED, 0.9
    if event in ("order_shipped", "refund_issued"):
        return event, 0.85
    return INTENT_UNKNOWN, 0.5


class IntentClassifier:
    """
    Hybrid: rules first, optional LLM fallback.
    No DB writes. No financial operations.
    """

    def __init__(
        self,
        llm_client: Optional[LLMClientInterface] = None,
        use_llm_fallback: bool = False,
        min_confidence_for_llm: float = 0.6,
    ):
        self._llm = llm_client
        self._use_llm_fallback = use_llm_fallback and llm_client is not None
        self._min_confidence_for_llm = min_confidence_for_llm

    def classify_rules_only(self, fact: CanonicalFact) -> Signal:
        """
        Rule-based only; no LLM. Use for unit tests and deterministic path.
        """
        intent, confidence = _rule_based_classify(fact)
        signal_id = f"sig-{uuid.uuid4().hex[:12]}"
        return Signal(
            signal_id=signal_id,
            intent=intent,
            confidence=confidence,
            fact_ids=[fact.fact_id],
            user_id=fact.user_id,
        )

    async def classify(self, fact: CanonicalFact) -> Signal:
        """
        Classify a single canonical fact into a Signal.
        Rules first; LLM only if enabled and rule confidence below threshold.
        """
        intent, confidence = _rule_based_classify(fact)
        if self._use_llm_fallback and confidence < self._min_confidence_for_llm:
            try:
                intent, confidence = await self._llm_classify(fact)
            except Exception as e:
                logger.warning("LLM intent fallback failed, using rule result: %s", e)
        signal_id = f"sig-{uuid.uuid4().hex[:12]}"
        return Signal(
            signal_id=signal_id,
            intent=intent,
            confidence=confidence,
            fact_ids=[fact.fact_id],
            user_id=fact.user_id,
        )

    async def _llm_classify(self, fact: CanonicalFact) -> tuple[str, float]:
        """Optional LLM refinement. Returns (intent, confidence)."""
        if not self._llm:
            return _rule_based_classify(fact)
        prompt = (
            f"Classify this shopping event into one intent: order_created, high_value_purchase, "
            f"frequent_merchant, order_shipped, refund_issued, or unknown. "
            f"Event: {fact.event_type}, merchant: {fact.merchant}, amount: {fact.amount} {fact.currency}. "
            f"Reply with JSON: {{\"intent\": \"...\", \"confidence\": 0.0-1.0}}"
        )
        try:
            raw = await self._llm.complete(prompt, max_tokens=64, temperature=0.0)
            if isinstance(raw, str):
                import json
                data = json.loads(raw)
                intent = (data.get("intent") or "unknown").strip().lower()
                conf = float(data.get("confidence", 0.5))
                conf = max(0.0, min(1.0, conf))
                return intent, conf
        except Exception as e:
            logger.warning("LLM classify failed: %s", e)
        return _rule_based_classify(fact)

    async def classify_batch(self, facts: List[CanonicalFact]) -> List[Signal]:
        """Classify multiple facts; no cross-fact state."""
        out: List[Signal] = []
        for f in facts:
            out.append(await self.classify(f))
        return out
