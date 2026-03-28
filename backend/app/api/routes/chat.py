"""Chat assistant."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.route_support import *  # noqa: F403
from app.schemas.api.domain_models import ChatMessage  # explicit for runtime use

router = APIRouter(tags=['chat'])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, user: User = Depends(get_current_user)):
    # Get user context
    purchases = await db.purchases.find_by_user(user.id, limit=20)
    
    # Get chat history
    chat_history = await db.chat_messages.find_by_user(user.id, limit=10)
    chat_history.reverse()
    
    # Build context (system prompt)
    context = f"""You are Lynkr AI Assistant - a helpful, friendly shopping and rewards advisor.

User Info:
- Name: {user.full_name}
- Points: {user.points}
- Recent purchases: {len(purchases)}

Recent Purchases:
{json.dumps([{"brand": p['brand'], "amount": p['amount'], "status": p['status'], "date": p['timestamp']} for p in purchases[:5]], indent=2)}

Your capabilities:
1. Explain spending insights and patterns
2. Recommend best rewards to redeem
3. Answer questions about purchases and their status
4. Provide shopping tips and advice
5. Help with rewards redemption strategy

Be conversational, helpful, and concise. Use emojis sparingly."""
    
    llm_type, gemini_client = _get_chat_llm()
    assistant_message = None

    if llm_type == "gemini" and gemini_client:
        try:
            conv = []
            for msg in chat_history:
                conv.append(f"{msg['role'].upper()}: {msg['content']}")
            conv.append(f"USER: {request.message}")
            prompt = "\n\n".join(conv) if conv else request.message
            raw = await gemini_client.complete(
                prompt,
                system_prompt=context,
                max_tokens=500,
                temperature=0.7,
            )
            assistant_message = (raw if isinstance(raw, str) else str(raw)).strip()
        except Exception as e:
            logging.warning("Gemini chat failed, falling back to OpenAI: %s", e)

    if not assistant_message and openai_client and os.environ.get("OPENAI_API_KEY"):
        messages = [{"role": "system", "content": context}]
        for msg in chat_history:
            messages.append({"role": msg['role'], "content": msg['content']})
        messages.append({"role": "user", "content": request.message})
        try:
            response = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            assistant_message = response.choices[0].message.content
        except Exception as e:
            logging.error("OpenAI chat error: %s", e)
            raise HTTPException(status_code=500, detail=f"Chat service unavailable: {str(e)}")

    if not assistant_message:
        raise HTTPException(status_code=503, detail="No chat provider available. Set GEMINI_API_KEY or OPENAI_API_KEY.")

    # Save user message
    user_msg = ChatMessage(
        user_id=user.id,
        role="user",
        content=request.message
    )
    user_doc = user_msg.model_dump()
    user_doc['timestamp'] = user_doc['timestamp'].isoformat()
    await db.chat_messages.insert_one(user_doc)
    
    # Save assistant message
    assistant_msg = ChatMessage(
        user_id=user.id,
        role="assistant",
        content=assistant_message
    )
    assistant_doc = assistant_msg.model_dump()
    assistant_doc['timestamp'] = assistant_doc['timestamp'].isoformat()
    await db.chat_messages.insert_one(assistant_doc)
    
    return ChatResponse(
        id=assistant_msg.id,
        role="assistant",
        content=assistant_message,
        timestamp=assistant_msg.timestamp.isoformat()
    )

@router.get("/chat/history")
async def get_chat_history(user: User = Depends(get_current_user)):
    messages = await db.chat_messages.find_by_user(user.id, sort_asc=True)
    
    return [
        ChatResponse(
            id=msg['id'],
            role=msg['role'],
            content=msg['content'],
            timestamp=msg['timestamp']
        ) for msg in messages
    ]

@router.delete("/chat/history")
async def clear_chat_history(user: User = Depends(get_current_user)):
    await db.chat_messages.delete_many_by_user(user.id)
    return {"success": True, "message": "Chat history cleared"}
