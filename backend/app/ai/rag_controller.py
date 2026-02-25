"""
RAG controller – retrieve summarized historical insights via vector store.
Bounded retrieval (top_k). Never retrieve raw transactions.
Abstract VectorStore and LLMClient for swappable providers.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, List, Optional

logger = logging.getLogger(__name__)


class VectorStoreInterface(ABC):
    """Abstract vector store; swap implementation (e.g. in-memory, Pinecone, pgvector)."""

    @abstractmethod
    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        user_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Return list of hits with at least: id, text, score."""
        ...

    @abstractmethod
    async def upsert(self, id: str, embedding: List[float], text: str, user_id: str) -> None:
        """Store one summarized insight."""
        ...


class InMemoryVectorStore(VectorStoreInterface):
    """Minimal in-memory store for development; replace with real vector DB in production."""

    def __init__(self):
        self._items: List[Dict[str, Any]] = []

    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        user_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        # Naive: return last N by user (no real embedding similarity)
        filtered = [x for x in self._items if user_id is None or x.get("user_id") == user_id]
        return filtered[-top_k:][::-1]

    async def upsert(self, id: str, embedding: List[float], text: str, user_id: str) -> None:
        self._items = [x for x in self._items if x.get("id") != id]
        self._items.append({
            "id": id,
            "embedding": embedding,
            "text": text,
            "user_id": user_id,
        })


class EmbeddingProviderInterface(ABC):
    """Abstract embedding provider."""

    @abstractmethod
    async def embed(self, text: str) -> List[float]:
        """Return embedding vector for text."""
        ...


class RAGController:
    """
    Retrieve summarized insights only. top_k bounded. No raw transactions.
    """

    def __init__(
        self,
        vector_store: VectorStoreInterface,
        embedding_provider: Optional[EmbeddingProviderInterface] = None,
        top_k: int = 5,
    ):
        self._store = vector_store
        self._embedder = embedding_provider
        self._top_k = top_k

    async def retrieve(
        self,
        query: str,
        user_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Bounded retrieval. If no embedder, returns empty or store's default.
        """
        if self._embedder is None:
            # TODO: wire embedder in integration
            return await self._store.search([], top_k=self._top_k, user_id=user_id)
        try:
            query_embedding = await self._embedder.embed(query)
            return await self._store.search(
                query_embedding,
                top_k=self._top_k,
                user_id=user_id,
            )
        except Exception as e:
            logger.warning("RAG retrieve failed: %s", e)
            return []
