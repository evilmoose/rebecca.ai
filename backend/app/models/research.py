"""
/app/models/research.py
Models for the research system.
"""
from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.db import Base

class ResearchResult(Base):
    """SQLAlchemy model for research results."""
    __tablename__ = "research_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_question = Column(Text, nullable=False)
    scope_of_work = Column(Text)
    summarized_result = Column(Text)
    raw_result = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", backref="research_results")

class ConversationSummary(Base):
    """SQLAlchemy model for conversation summaries."""
    __tablename__ = "conversation_summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text)
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", backref="conversation_summaries")
    