from typing import List, Dict, Any
from pydantic import BaseModel

class ThreadMessagesResponse(BaseModel):
    thread_id: str
    messages: List[dict]
    tool_outputs: List[str] = [] 