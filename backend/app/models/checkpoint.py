from sqlalchemy import Column, DateTime, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.core.db import Base

class LangGraphCheckpoint(Base):
    __tablename__ = "langgraph_checkpoints"
    
    checkpoint_key = Column(JSONB, nullable=False)
    state = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    __table_args__ = (
        PrimaryKeyConstraint('checkpoint_key', name='langgraph_checkpoints_pkey'),
    ) 