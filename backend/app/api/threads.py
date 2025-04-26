from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.api.users import current_active_user
from app.models.user import User
from app.models.thread import Thread
from app.services.thread_service import ThreadService
from app.services.checkpoint_service import CheckpointService
from app.schemas.thread import ThreadCreate, ThreadResponse, ThreadMessagesResponse
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime

router = APIRouter(prefix="/threads", tags=["threads"])

@router.post("", response_model=ThreadResponse)
async def create_thread(
    data: ThreadCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user)
):
    # Ensure user is fully loaded before accessing attributes
    # This is to avoid the MissingGreenlet error when accessing user.id
    user_id = user.id if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")
    
    thread_service = ThreadService(db)
    thread_id = await thread_service.create_thread(
        user_id=user_id,
        context_type=data.context_type,
        task_type=data.task_type,
        title=data.title
    )
    
    # Explicitly commit the transaction to ensure the thread is saved
    await db.commit()
    
    # Initialize an empty thread checkpoint to ensure it exists
    checkpoint_service = CheckpointService(db)
    try:
        await checkpoint_service.initialize_empty_checkpoint(
            thread_id=thread_id,
            context_type=data.context_type,
            task_type=data.task_type
        )
        print(f"Initialized empty checkpoint for thread {thread_id}")
    except Exception as e:
        print(f"Error initializing thread checkpoint: {e}")
        # Don't fail the thread creation if checkpoint initialization fails
    
    # Get the created thread directly by ID
    threads = await thread_service.get_threads_for_user(
        user_id=user_id,
        thread_id=thread_id
    )
    
    if not threads:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Return the first (and should be only) thread
    return threads[0]

@router.get("", response_model=List[ThreadResponse])
async def get_threads(
    include_archived: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user)
):
    # Ensure user is fully loaded before accessing attributes
    user_id = user.id if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")
    
    thread_service = ThreadService(db)
    threads = await thread_service.get_threads_for_user(
        user_id=user_id,
        include_archived=include_archived
    )
    return threads

@router.get("/{thread_id}/messages", response_model=ThreadMessagesResponse)
async def get_thread_messages(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user)
):
    """
    Get messages for a thread
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Retrieving messages for thread {thread_id}")
    
    # Verify thread exists and belongs to user
    thread_service = ThreadService(db)
    threads = await thread_service.get_threads_for_user(
        user_id=user.id,
        thread_id=thread_id
    )
    
    if not threads:
        logger.error(f"Thread {thread_id} not found or doesn't belong to user {user.id}")
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # The first item in the list is our thread - it's a dictionary
    thread = threads[0]
    
    # Retrieve messages from thread
    try:
        checkpoint_service = CheckpointService(db)
        checkpoint = await checkpoint_service.get_latest_checkpoint_for_thread(thread_id)
        
        if not checkpoint:
            logger.warning(f"No checkpoint found for thread {thread_id}")
            return ThreadMessagesResponse(thread_id=thread_id, messages=[])
        
        messages_data = checkpoint.get("messages", [])
        logger.debug(f"Retrieved {len(messages_data)} raw messages")
        
        # Process and format messages
        formatted_messages = []
        for message in messages_data:
            try:
                # Extract message type/role - handle different message formats
                message_type = None
                content = None
                
                # Try to determine message type
                if isinstance(message, dict):
                    # Direct dictionary format
                    if "type" in message:
                        message_type = message.get("type")
                    elif "role" in message:
                        message_type = message.get("role")
                        
                    # LangChain format
                    if message_type == "human":
                        message_type = "user"
                    elif message_type == "ai":
                        message_type = "assistant"
                        
                    # Extract content based on format
                    if "content" in message:
                        content = message.get("content")
                    elif "text" in message:
                        content = message.get("text")
                    elif "body" in message:
                        content = message.get("body")
                        
                # Handle string content (convert to user message)
                elif isinstance(message, str):
                    message_type = "user"
                    content = message
                
                # Skip messages with no content or unknown type
                if content is None:
                    logger.warning(f"Could not extract content from message: {message}")
                    continue
                    
                if message_type is None:
                    logger.warning(f"Could not determine message type: {message}")
                    message_type = "unknown"
                
                # Create formatted message
                formatted_message = {
                    "role": message_type,
                    "content": content,
                    "created_at": datetime.now().isoformat()
                }
                
                formatted_messages.append(formatted_message)
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                # Continue processing other messages
                continue
        
        logger.info(f"Successfully processed {len(formatted_messages)} messages")
        return ThreadMessagesResponse(thread_id=thread_id, messages=formatted_messages)
        
    except Exception as e:
        logger.error(f"Error retrieving messages for thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving messages: {str(e)}")

@router.put("/{thread_id}/archive")
async def archive_thread(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user)
):
    """Archive a thread"""
    user_id = user.id
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")
    
    thread_service = ThreadService(db)
    success = await thread_service.archive_thread(thread_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Thread not found or doesn't belong to user")
    
    return {"status": "success", "message": "Thread archived successfully"} 