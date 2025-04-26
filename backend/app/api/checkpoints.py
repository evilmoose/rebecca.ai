from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.api.users import current_active_user
from app.models.user import User
from app.services.checkpoint_service import CheckpointService
from app.services.thread_service import ThreadService
from app.schemas.checkpoint import CheckpointReset
from typing import Dict, Any
import json

router = APIRouter(prefix="/checkpoints", tags=["checkpoints"])

@router.post("/reset")
async def reset_checkpoint(
    data: CheckpointReset,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user)
):
    """
    Reset a checkpoint for a thread (delete and initialize a new empty one)
    """
    # Ensure user is fully loaded before accessing attributes
    user_id = user.id if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")
    
    # First, verify thread belongs to user
    thread_service = ThreadService(db)
    threads = await thread_service.get_threads_for_user(
        user_id=user_id,
        thread_id=data.thread_id
    )
    
    if not threads:
        raise HTTPException(
            status_code=404,
            detail="Thread not found or doesn't belong to user"
        )
    
    # Reset the checkpoint
    checkpoint_service = CheckpointService(db)
    checkpoint_key = {"thread_id": data.thread_id}
    
    # Delete existing checkpoint
    await checkpoint_service.delete_checkpoint(checkpoint_key)
    
    # Create a new empty checkpoint
    thread = threads[0]
    success = await checkpoint_service.initialize_empty_checkpoint(
        thread_id=data.thread_id,
        context_type=thread.get("context_type", "general_chat"),
        task_type=thread.get("task_type")
    )
    
    if success:
        return {"status": "success", "message": f"Checkpoint for thread '{data.thread_id}' has been reset"}
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to reset checkpoint"
        ) 