"""
Orchestrator control plane – deterministic only.
Accepts signals; deduplicates; correlates; decides: ignore | direct_insight | trigger_reasoning.
Never calls LLM. No AI logic inside.
"""

from __future__ import annotations

import logging
import uuid
from collections import defaultdict
from typing import List, Optional

from app.schemas.signal import Signal
from app.schemas.insight import Insight

logger = logging.getLogger(__name__)

# Decision types (deterministic)
DECISION_IGNORE = "ignore"
DECISION_DIRECT_INSIGHT = "direct_insight"
DECISION_TRIGGER_REASONING = "trigger_reasoning"

# Insight types and priority
INSIGHT_TYPE_DIRECT = "direct_insight"
INSIGHT_TYPE_REASONING = "trigger_reasoning"
PRIORITY_LOW = "low"
PRIORITY_MEDIUM = "medium"
PRIORITY_HIGH = "high"
STATE_PENDING = "pending"


def _deduplicate_signals(signals: List[Signal]) -> List[Signal]:
    """Drop duplicate signal_ids; keep first occurrence."""
    seen: set[str] = set()
    out: List[Signal] = []
    for s in signals:
        if s.signal_id not in seen:
            seen.add(s.signal_id)
            out.append(s)
    return out


def _decision_for_signal(signal: Signal) -> tuple[str, str]:
    """
    Pure deterministic routing. Returns (decision, priority).
    No LLM. Unit-testable.
    """
    if signal.confidence < 0.5:
        return DECISION_IGNORE, PRIORITY_LOW
    intent = (signal.intent or "").strip().lower()
    if intent == "unknown":
        return DECISION_IGNORE, PRIORITY_LOW
    if intent in ("high_value_purchase", "refund_issued"):
        return DECISION_TRIGGER_REASONING, PRIORITY_HIGH
    if intent in ("order_created", "order_shipped"):
        return DECISION_DIRECT_INSIGHT, PRIORITY_MEDIUM
    if intent == "frequent_merchant":
        return DECISION_TRIGGER_REASONING, PRIORITY_MEDIUM
    return DECISION_DIRECT_INSIGHT, PRIORITY_LOW


class ControlPlane:
    """
    Deterministic orchestrator. Correlates signals (e.g. by user_id, time window).
    Outputs Insight objects only. Never calls LLM.
    """

    def __init__(self, correlation_window_seconds: int = 300):
        self._correlation_window = correlation_window_seconds
        # In-memory only; no DB. For replay, caller can pass pre-deduplicated signals.
        self._recent_signal_ids: dict[str, list[float]] = defaultdict(list)

    def process(self, signals: List[Signal]) -> List[Insight]:
        """
        Deduplicate, correlate, decide. Returns list of Insights.
        Pure deterministic logic.
        """
        signals = _deduplicate_signals(signals)
        insights: List[Insight] = []
        for s in signals:
            decision, priority = _decision_for_signal(s)
            if decision == DECISION_IGNORE:
                continue
            insight_type = (
                INSIGHT_TYPE_REASONING
                if decision == DECISION_TRIGGER_REASONING
                else INSIGHT_TYPE_DIRECT
            )
            insight_id = f"ins-{uuid.uuid4().hex[:12]}"
            insights.append(
                Insight(
                    insight_id=insight_id,
                    type=insight_type,
                    priority=priority,
                    state=STATE_PENDING,
                    signal_refs=[s.signal_id],
                    user_id=s.user_id,
                )
            )
        return insights
