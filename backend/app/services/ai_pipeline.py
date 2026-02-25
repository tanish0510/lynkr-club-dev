"""
AI pipeline – single entrypoint: canonical fact(s) in, insights + recommendations out.
Deterministic → probabilistic → optional memory (after resolution).
No DB writes for financial data. No AI inside route handlers; call this from a dedicated AI route.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.schemas.canonical_fact import CanonicalFact
from app.schemas.signal import Signal
from app.schemas.insight import Insight
from app.schemas.explanation import Explanation
from app.schemas.recommendation import Recommendation
from app.ai.intent_classifier import IntentClassifier
from app.ai.reasoning_agent import ReasoningAgent
from app.ai.recommendation_engine import RecommendationEngine
from app.ai.llm_client import LLMClientInterface
from app.ai.safety import AIConfig, CircuitBreaker
from app.orchestrator.control_plane import ControlPlane
from app.memory.memory_writer import MemoryWriter

logger = logging.getLogger(__name__)


class AIPipelineResult:
    """Output of pipeline run: insights with optional explanations and recommendations."""

    def __init__(
        self,
        insights: List[Insight],
        explanations: Optional[Dict[str, Explanation]] = None,
        recommendations: Optional[Dict[str, Recommendation]] = None,
        deterministic_only: bool = False,
    ):
        self.insights = insights
        self.explanations = explanations or {}
        self.recommendations = recommendations or {}
        self.deterministic_only = deterministic_only


class AIPipeline:
    """
    Wire: facts → classifier → control plane → (reasoning for trigger_reasoning insights)
    → recommendation engine. Memory write only when caller reports resolution.
    """

    def __init__(
        self,
        intent_classifier: IntentClassifier,
        control_plane: ControlPlane,
        reasoning_agent: Optional[ReasoningAgent] = None,
        recommendation_engine: Optional[RecommendationEngine] = None,
        memory_writer: Optional[MemoryWriter] = None,
        config: Optional[AIConfig] = None,
        circuit_breaker: Optional[CircuitBreaker] = None,
    ):
        self._classifier = intent_classifier
        self._orchestrator = control_plane
        self._reasoning = reasoning_agent
        self._recommendation = recommendation_engine or RecommendationEngine()
        self._memory = memory_writer
        self._config = config or AIConfig.from_env()
        self._circuit = circuit_breaker or CircuitBreaker()

    async def run(self, facts: List[CanonicalFact]) -> AIPipelineResult:
        """
        Process canonical facts through the pipeline. Returns insights and, when
        AI is enabled and circuit is closed, explanations + recommendations for
        trigger_reasoning insights.
        """
        if not facts:
            return AIPipelineResult(insights=[], deterministic_only=True)

        # 1) Classify (rules only if AI disabled)
        signals: List[Signal] = []
        for f in facts:
            if self._config.ai_disabled:
                sig = self._classifier.classify_rules_only(f)
            else:
                sig = await self._classifier.classify(f)
            signals.append(sig)

        # 2) Orchestrator (deterministic)
        insights = self._orchestrator.process(signals)
        if not insights:
            return AIPipelineResult(insights=[], deterministic_only=True)

        explanations: Dict[str, Explanation] = {}
        recommendations: Dict[str, Recommendation] = {}

        # 3) Reasoning only for trigger_reasoning insights, and only if AI enabled and circuit closed
        use_llm = (
            not self._config.ai_disabled
            and not self._circuit.is_open()
            and self._reasoning is not None
        )
        for ins in insights:
            if ins.type != "trigger_reasoning":
                continue
            if not use_llm:
                continue
            try:
                expl = await self._reasoning.explain(ins, context_summary=None)
                explanations[ins.insight_id] = expl
                rec = self._recommendation.recommend(expl)
                recommendations[ins.insight_id] = rec
                self._circuit.record_success()
            except Exception as e:
                logger.warning("Reasoning for insight %s failed: %s", ins.insight_id, e)
                self._circuit.record_failure()
                explanations[ins.insight_id] = Explanation(
                    what="Insight generated.",
                    why="Automated.",
                    impact="None.",
                    confidence=0.2,
                )
                recommendations[ins.insight_id] = self._recommendation.recommend(explanations[ins.insight_id])

        return AIPipelineResult(
            insights=insights,
            explanations=explanations,
            recommendations=recommendations,
            deterministic_only=self._config.ai_disabled,
        )

    async def record_resolution(
        self,
        insight_id: str,
        user_id: str,
        summary: str,
        outcome: str,
        user_action_taken: Optional[str] = None,
    ) -> None:
        """Call after insight is resolved; writes to memory only."""
        if self._memory:
            await self._memory.write_after_resolution(
                insight_id, user_id, summary, outcome, user_action_taken
            )


def create_default_pipeline(
    llm_client: Optional[LLMClientInterface] = None,
    ai_disabled: bool = False,
) -> AIPipeline:
    """
    Factory: build pipeline with default components. Replace with DI in production.
    """
    config = AIConfig(ai_disabled=ai_disabled)
    classifier = IntentClassifier(llm_client=llm_client, use_llm_fallback=llm_client is not None and not ai_disabled)
    control_plane = ControlPlane()
    reasoning = ReasoningAgent(llm_client=llm_client) if llm_client and not ai_disabled else None
    return AIPipeline(
        intent_classifier=classifier,
        control_plane=control_plane,
        reasoning_agent=reasoning,
        recommendation_engine=RecommendationEngine(),
        memory_writer=None,  # TODO: wire VectorStore + MemoryWriter when DB ready
        config=config,
        circuit_breaker=CircuitBreaker(),
    )
