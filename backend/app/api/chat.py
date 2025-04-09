from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.services.langgraph_chat_service import LangGraphChatService
from typing import Dict, Any
import json

router = APIRouter(prefix="/chat", tags=["chat"])
chat_service = LangGraphChatService()

@router.post("/stream")
async def stream_chat(request: Request):
    """
    Stream chat responses from the AI model.
    
    Args:
        request: FastAPI request object containing the user message and thread_id
        
    Returns:
        StreamingResponse: Server-sent events stream of AI responses
    """
    try:
        body = await request.json()
        user_message = body.get("message", "")
        thread_id = body.get("thread_id", "default")
        
        if not user_message:
            return {"error": "No message provided"}, 400

        async def chat_stream():
            try:
                current_content = ""
                tool_outputs = []
                
                async for message_part in chat_service.stream_response(user_message, thread_id):
                    message_type = message_part.get("type", "response")
                    content = message_part.get("content", "")
                    is_complete = message_part.get("complete", False)
                    
                    # For tool output messages, collect them to send as a separate response
                    if message_type == "tool_output":
                        print(f"Tool output received: {content[:100]}...")
                        tool_outputs.append(content)
                        # Send tool outputs immediately
                        yield f"data: {json.dumps({'content': content, 'type': 'tool_output', 'complete': True})}\n\n"
                    
                    # For complete messages (announcements, status updates), send them immediately
                    elif is_complete and message_type != "response":
                        yield f"data: {json.dumps({'content': content, 'type': message_type, 'complete': True})}\n\n"
                    
                    # For streaming content of the main response, accumulate and send updates
                    elif message_type == "response":
                        if content:
                            current_content = content  # For streaming, we replace rather than append
                            # Add tool outputs to the context for frontend processing
                            payload = {
                                'content': current_content, 
                                'type': message_type, 
                                'complete': False
                            }
                            yield f"data: {json.dumps(payload)}\n\n"
                        elif is_complete:
                            # Empty content with response type signals completion
                            # Include tool outputs as a separate field
                            payload = {
                                'content': current_content, 
                                'type': message_type, 
                                'complete': True,
                                'tool_outputs': tool_outputs if tool_outputs else None
                            }
                            yield f"data: {json.dumps(payload)}\n\n"
                    
            except Exception as e:
                print(f"Error in chat_stream: {str(e)}")
                yield f"data: {json.dumps({'content': f'Error: {str(e)}', 'type': 'error', 'complete': True})}\n\n"

        return StreamingResponse(
            chat_stream(),
            media_type="text/event-stream"
        )
    except Exception as e:
        print(f"Error in stream_chat: {str(e)}")
        return {"error": str(e)}, 500

@router.post("/reset")
async def reset_memory(request: Request) -> Dict[str, str]:
    """
    Reset the conversation memory for a specific thread.
    
    Args:
        request: FastAPI request object containing the thread_id
        
    Returns:
        Dict[str, str]: Status message
    """
    try:
        body = await request.json()
        thread_id = body.get("thread_id", "default")
        
        chat_service.reset_thread(thread_id)
        return {"status": f"Thread '{thread_id}' memory cleared"}
    except Exception as e:
        return {"error": str(e)}, 500 