from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class CheckpointCreate(BaseModel):
    checkpoint_key: Dict[str, Any]
    state: Dict[str, Any]

class CheckpointResponse(BaseModel):
    checkpoint_key: Dict[str, Any]
    state: Dict[str, Any]
    created_at: datetime

class CheckpointReset(BaseModel):
    thread_id: str 