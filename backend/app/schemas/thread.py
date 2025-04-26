from pydantic import BaseModel, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime

class ThreadCreate(BaseModel):
    context_type: str = "general_chat"
    task_type: Optional[str] = None
    title: Optional[str] = None

class ThreadResponse(BaseModel):
    thread_id: UUID4
    title: Optional[str] = None
    context_type: str
    task_type: Optional[str] = None
    created_at: datetime
    last_activity_at: datetime
    is_archived: bool = False

class ThreadMessagesResponse(BaseModel):
    thread_id: UUID4
    messages: List[Dict[str, Any]]
    tool_outputs: List[str] = [] 