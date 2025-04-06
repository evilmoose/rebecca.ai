"""
/app/models/video_note.py
This module contains the models for the video note.
"""
import uuid
from sqlalchemy import Column, Text, Integer, TIMESTAMP, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.db import Base

class VideoNote(Base):
    """SQLAlchemy model for video notes."""
    __tablename__ = "video_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(Text, nullable=True)
    transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    topic = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", backref="video_notes")



