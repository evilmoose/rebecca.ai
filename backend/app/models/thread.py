from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UUID
from sqlalchemy.sql import func
import uuid
from app.core.db import Base

class Thread(Base):
    __tablename__ = "threads"
    
    thread_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=True)
    context_type = Column(String(50), nullable=False, default="general_chat")
    task_type = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_activity_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    is_archived = Column(Boolean, nullable=False, default=False) 