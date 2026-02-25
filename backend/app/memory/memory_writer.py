"""
Memory writer – called only AFTER insight resolution.
Stores: summary, outcome, user action taken. Updates vector store and relational summary.
Never stores raw financial data.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from app.schemas.insight import Insight
from app.schemas.explanation import Explanation
from app.schemas.recommendation import Recommendation
from app.ai.rag_controller import VectorStoreInterface

logger = logging.getLogger(__name__)


class MemoryWriter:
    """
    Only invoked after insight is resolved (e.g. user saw it, dismissed, or acted).
    Writes summary to vector store; optional relational summary store.
    """

    def __init__(
        self,
        vector_store: VectorStoreInterface,
        embedding_provider: Optional[Any] = None,
    ):
        self._store = vector_store
        self._embedder = embedding_provider

    async def write_after_resolution(
        self,
        insight_id: str,
        user_id: str,
        summary: str,
        outcome: str,
        user_action_taken: Optional[str] = None,
    ) -> None:
        """
        Store summarized memory. No raw transactions, no PII beyond user_id.
        """
        text = f"{summary} Outcome: {outcome}. User action: {user_action_taken or 'none'}"
        embedding: list[float] = []
        if self._embedder:
            try:
                embedding = await self._embedder.embed(text)
            except Exception as e:
                logger.warning("Embedding for memory write failed: %s", e)
        await self._store.upsert(insight_id, embedding, text, user_id)
        # TODO: optional relational summary table (e.g. MongoDB collection) for analytics
        logger.info("Memory written for insight %s user %s", insight_id, user_id)
