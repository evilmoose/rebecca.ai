"""
/app/schemas/research.py
Pydantic schemas for research API.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class ResearchRequest(BaseModel):
    """Schema for research request."""
    query: str = Field(..., description="The research question to investigate")

class ResearchResponse(BaseModel):
    """Schema for research response."""
    id: int
    user_id: int
    original_question: str
    scope_of_work: Optional[str]
    summarized_result: Optional[str]
    raw_result: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskResponse(BaseModel):
    """Schema for task response."""
    message: str
    task_id: str