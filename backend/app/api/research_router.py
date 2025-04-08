from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.research import ResearchResult
from app.services.tasks import run_deep_research_task
from app.schemas.research import ResearchRequest, ResearchResponse, TaskResponse
from sqlalchemy import select
from typing import Dict, Any
from app.models.user import User
from app.api.users import current_active_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/deep-research", response_model=TaskResponse)
async def create_research(
    request: ResearchRequest,
    current_user: User = Depends(current_active_user),
):
    """Start a new deep research task."""
    task = run_deep_research_task.delay(current_user.id, request.query)
    return TaskResponse(
        message="Research task started",
        task_id=task.id
    )

@router.get("/deep-research/{task_id}", response_model=ResearchResponse)
async def get_research_result(
    task_id: str,
    current_user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get research results."""
    task = run_deep_research_task.AsyncResult(task_id)
    
    if task.ready():
        result = await db.execute(
            select(ResearchResult)
            .where(
                ResearchResult.user_id == current_user.id,
                ResearchResult.id == task.result["id"]
            )
        )
        research = result.scalar_one_or_none()
        
        if not research:
            raise HTTPException(status_code=404, detail="Research not found")
            
        return research
    else:
        return {
            "status": "in_progress",
            "progress": task.info.get("progress", 0)
        }