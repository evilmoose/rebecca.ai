from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.services.chat_service import ChatService
from typing import Dict, Any

router = APIRouter(prefix="/chat", tags=["chat"])
chat_service = ChatService()

@router.post("/stream")
async def stream_chat(request: Request):
    """
    Stream chat responses from the AI model.
    
    Args:
        request: FastAPI request object containing the user message
        
    Returns:
        StreamingResponse: Server-sent events stream of AI responses
    """
    try:
        body = await request.json()
        user_message = body.get("message", "")
        
        if not user_message:
            return {"error": "No message provided"}, 400

        async def chat_stream():
            try:
                async for chunk in chat_service.llm.astream(user_message):
                    yield f"data: {chunk.content}\n\n"
            except Exception as e:
                yield f"data: Error: {str(e)}\n\n"

        return StreamingResponse(
            chat_stream(),
            media_type="text/event-stream"
        )
    except Exception as e:
        return {"error": str(e)}, 500

@router.post("/reset")
async def reset_memory() -> Dict[str, str]:
    """
    Reset the conversation memory.
    
    Returns:
        Dict[str, str]: Status message
    """
    try:
        chat_service.clear_memory()
        return {"status": "memory cleared"}
    except Exception as e:
        return {"error": str(e)}, 500 