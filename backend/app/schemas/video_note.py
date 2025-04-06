from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class VideoNoteCreate(BaseModel):
    """Schema for creating a video note."""
    file_name: Optional[str]
    transcript: str
    summary: str
    topic: Optional[str]

class VideoNoteRead(VideoNoteCreate):
    """Schema for reading a video note."""
    id: UUID
    user_id: int
    created_at: datetime
    updated_at: datetime
