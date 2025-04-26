from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, update
import uuid
from datetime import datetime
from fastapi import Depends
from app.core.db import get_db
from app.models.thread import Thread
from typing import List, Dict, Any, Optional
from sqlalchemy.future import select

class ThreadService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_thread(
            self, user_id: int, 
            context_type: str = "general_chat", 
            task_type: str = None, 
            title: str = None
        ) -> str:
        """Create a new thread and return its ID"""
        thread_id = str(uuid.uuid4())
        
        # Using SQLAlchemy Core for direct SQL execution
        query = """
        INSERT INTO threads (thread_id, user_id, title, context_type, task_type)
        VALUES (:thread_id, :user_id, :title, :context_type, :task_type)
        RETURNING thread_id::text
        """
        
        values = {
            "thread_id": thread_id,
            "user_id": user_id,
            "title": title,
            "context_type": context_type,
            "task_type": task_type
        }
        
        try:
            result = await self.db.execute(text(query), values)
            returned_thread_id = result.scalar_one()
            return returned_thread_id
        except Exception as e:
            print(f"Error creating thread: {e}")
            raise
    
    async def get_threads_for_user(
            self, user_id: int, 
            include_archived: bool = False,
            thread_id: str = None
        ) -> List[Dict[str, Any]]:
        """Get all threads for a user, or a specific thread if thread_id is provided"""
        query = """
        SELECT thread_id, title, context_type, task_type, created_at, last_activity_at, is_archived
        FROM threads
        WHERE user_id = :user_id
        """
        
        params = {"user_id": user_id}
        
        if thread_id:
            query += " AND thread_id = :thread_id"
            params["thread_id"] = thread_id
        
        if not include_archived:
            query += " AND is_archived = FALSE"
            
        query += " ORDER BY last_activity_at DESC"
        
        result = await self.db.execute(text(query), params)
        rows = result.fetchall()
        
        return [dict(row._mapping) for row in rows]
        
    async def update_thread_activity(self, thread_id: str) -> None:
        """Update the last_activity_at timestamp for a thread"""
        query = """
        UPDATE threads
        SET last_activity_at = NOW()
        WHERE thread_id = :thread_id
        """
        
        await self.db.execute(text(query), {"thread_id": thread_id})
        
    async def archive_thread(self, thread_id: str, user_id: int) -> bool:
        """Archive a thread belonging to a user"""
        query = """
        UPDATE threads
        SET is_archived = TRUE
        WHERE thread_id = :thread_id AND user_id = :user_id
        RETURNING thread_id
        """
        
        result = await self.db.execute(text(query), {"thread_id": thread_id, "user_id": user_id})
        return result.scalar_one_or_none() is not None 
        
    async def update_thread_title_from_first_message(self, thread_id: str, message: str) -> None:
        """
        Generate and update a thread title based on the first message
        """
        # Generate a concise title from the message (max 50 chars)
        title = message[:47] + "..." if len(message) > 50 else message
        
        # Update the title in the database
        query = """
        UPDATE threads 
        SET title = :title 
        WHERE thread_id = :thread_id AND (title IS NULL OR title = '')
        """
        
        await self.db.execute(text(query), {
            "thread_id": thread_id, 
            "title": title
        }) 