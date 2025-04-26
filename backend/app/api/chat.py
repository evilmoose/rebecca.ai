from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.langgraph_chat_service import LangGraphChatService
from app.services.thread_service import ThreadService
from app.services.checkpoint_service import CheckpointService
from app.core.db import get_db
from typing import Dict, Any
from app.schemas.checkpoint import CheckpointReset
import json
import traceback

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/stream")
async def stream_chat(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Stream chat responses from the AI model.
    
    Args:
        request: FastAPI request object containing the user message and thread_id
        db: Database session for thread management
        
    Returns:
        StreamingResponse: Server-sent events stream of AI responses
    """
    try:
        body = await request.json()
        user_message = body.get("message", "")
        thread_id = body.get("thread_id")
        context_type = body.get("context_type", "general_chat")
        task_type = body.get("task_type")
        
        if not user_message:
            return JSONResponse(
                status_code=400,
                content={"error": "No message provided"}
            )
            
        if not thread_id:
            return JSONResponse(
                status_code=400,
                content={"error": "No thread_id provided"}
            )

        # Update thread title if first message
        thread_service = ThreadService(db)
        await thread_service.update_thread_title_from_first_message(thread_id, user_message)
        
        # Initialize chat service with DB connection
        chat_service = LangGraphChatService(db)

        async def chat_stream():
            try:
                current_content = ""
                tool_outputs = []
                
                async for message_part in chat_service.stream_response(
                    message=user_message, 
                    thread_id=thread_id,
                    context_type=context_type,
                    task_type=task_type
                ):
                    message_type = message_part.get("type", "response")
                    content = message_part.get("content", "")
                    is_complete = message_part.get("complete", False)
                    message_tool_outputs = message_part.get("tool_outputs", None)
                    
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
                                'tool_outputs': message_tool_outputs or tool_outputs
                            }
                            yield f"data: {json.dumps(payload)}\n\n"
                    
            except Exception as e:
                print(f"Error in chat_stream: {str(e)}")
                traceback.print_exc()
                yield f"data: {json.dumps({'content': f'Error: {str(e)}', 'type': 'error', 'complete': True})}\n\n"

        return StreamingResponse(
            chat_stream(),
            media_type="text/event-stream"
        )
    except Exception as e:
        print(f"Error in stream_chat: {str(e)}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@router.post("/reset")
async def reset_memory(request: Request, db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """
    Reset the conversation memory for a specific thread.
    
    Args:
        request: FastAPI request object containing the thread_id
        db: Database session for thread management
        
    Returns:
        Dict[str, str]: Status message
    """
    try:
        body = await request.json()
        thread_id = body.get("thread_id")
        
        if not thread_id:
            return JSONResponse(
                status_code=400,
                content={"error": "No thread_id provided"}
            )
        
        chat_service = LangGraphChatService(db)
        success = await chat_service.reset_thread(thread_id)
        
        if success:
            return {"status": f"Thread '{thread_id}' memory cleared"}
        else:
            return JSONResponse(
                status_code=500,
                content={"error": "Failed to reset thread memory"}
            )
    except Exception as e:
        print(f"Error in reset_memory: {str(e)}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500, 
            content={"error": str(e)}
        )

@router.post("/message")
async def send_message(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Send a chat message without streaming for simple thread history population.
    
    Args:
        request: FastAPI request object containing the user message and thread_id
        db: Database session for thread management
        
    Returns:
        JSON response with the AI's message
    """
    try:
        body = await request.json()
        user_message = body.get("message", "")
        thread_id = body.get("thread_id")
        context_type = body.get("context_type", "general_chat")
        task_type = body.get("task_type")
        
        if not user_message:
            return JSONResponse(
                status_code=400,
                content={"error": "No message provided"}
            )
            
        if not thread_id:
            return JSONResponse(
                status_code=400,
                content={"error": "No thread_id provided"}
            )

        # Update thread title if first message
        thread_service = ThreadService(db)
        await thread_service.update_thread_title_from_first_message(thread_id, user_message)
        
        # Initialize chat service with DB connection
        chat_service = LangGraphChatService(db)
        
        # Process message synchronously
        responses = []
        tool_outputs = []
        
        # Create a simple processor for the stream
        async for message_part in chat_service.stream_response(
            message=user_message, 
            thread_id=thread_id,
            context_type=context_type,
            task_type=task_type
        ):
            message_type = message_part.get("type", "response")
            content = message_part.get("content", "")
            is_complete = message_part.get("complete", False)
            message_tool_outputs = message_part.get("tool_outputs", None)
            
            if message_type == "tool_output" and content:
                tool_outputs.append(content)
            
            if message_type == "response" and is_complete and message_tool_outputs:
                tool_outputs.extend(message_tool_outputs or [])
            
            if message_type == "response" and content:
                responses.append(content)
        
        # Return the final response
        return {
            "role": "assistant",
            "content": " ".join(responses) if responses else "I processed your message.",
            "thread_id": thread_id,
            "tool_outputs": tool_outputs
        }
        
    except Exception as e:
        print(f"Error in send_message: {str(e)}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        ) 