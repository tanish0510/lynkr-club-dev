"""AI pipeline HTTP."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403

router = APIRouter(tags=['ai'])

@router.post("/ai/process-facts")
async def ai_process_facts(facts: List[dict], user: User = Depends(get_current_user)):
    """Process canonical facts through the AI pipeline. Returns insights and optional explanations/recommendations. No financial operations."""
    try:
        from app.schemas.canonical_fact import CanonicalFact
        canonical = [CanonicalFact.model_validate(f) for f in facts]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid canonical fact format: {e}")
    pipeline = _get_ai_pipeline()
    result = await pipeline.run(canonical)
    return {
        "insights": [i.model_dump() for i in result.insights],
        "explanations": {k: v.model_dump() for k, v in result.explanations.items()},
        "recommendations": {k: v.model_dump() for k, v in result.recommendations.items()},
        "deterministic_only": result.deterministic_only,
    }


@router.post("/ai/record-resolution")
async def ai_record_resolution(body: RecordResolutionBody, user: User = Depends(get_current_user)):
    """Record that an insight was resolved; updates memory only. No financial data stored."""
    pipeline = _get_ai_pipeline()
    await pipeline.record_resolution(
        insight_id=body.insight_id,
        user_id=user.id,
        summary=body.summary,
        outcome=body.outcome,
        user_action_taken=body.user_action_taken,
    )
    return {"success": True}
