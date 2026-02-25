"""
Failure safety – circuit breaker, AI disabled mode, low-confidence handling.
System must degrade safely; deterministic-only fallback path.
"""

from __future__ import annotations

import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    Simple circuit breaker: after max_failures consecutive failures, open for cooldown_seconds.
    """

    def __init__(self, max_failures: int = 5, cooldown_seconds: float = 60.0):
        self._max_failures = max_failures
        self._cooldown = cooldown_seconds
        self._failures = 0
        self._last_failure_time: Optional[float] = None
        self._open = False

    def record_success(self) -> None:
        self._failures = 0
        self._open = False

    def record_failure(self) -> None:
        self._failures += 1
        self._last_failure_time = time.monotonic()
        if self._failures >= self._max_failures:
            self._open = True
            logger.warning("Circuit breaker OPEN after %s failures", self._failures)

    def is_open(self) -> bool:
        if not self._open:
            return False
        if self._last_failure_time is None:
            return True
        if time.monotonic() - self._last_failure_time >= self._cooldown:
            self._open = False
            self._failures = 0
            logger.info("Circuit breaker HALF-OPEN (cooldown elapsed)")
            return False
        return True


class AIConfig:
    """
    AI disabled mode and low-confidence threshold.
    When AI_DISABLED=True, pipeline uses deterministic-only path.
    """

    def __init__(
        self,
        ai_disabled: bool = False,
        low_confidence_threshold: float = 0.5,
    ):
        self.ai_disabled = ai_disabled
        self.low_confidence_threshold = low_confidence_threshold

    @classmethod
    def from_env(cls) -> "AIConfig":
        import os
        disabled = os.environ.get("LYNKR_AI_DISABLED", "").lower() in ("1", "true", "yes")
        try:
            thresh = float(os.environ.get("LYNKR_AI_LOW_CONFIDENCE_THRESHOLD", "0.5"))
        except ValueError:
            thresh = 0.5
        return cls(ai_disabled=disabled, low_confidence_threshold=thresh)
