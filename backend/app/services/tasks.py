"""
/app/services/tasks.py
Celery tasks for research.
"""
from celery import Task
import asyncio
from typing import Dict, Any
import logging
from app.worker import celery_app
from app.services.research_service import ResearchService
from app.core.db import async_session_factory
from app.models.research import ResearchResult

logger = logging.getLogger(__name__)

class AsyncTask(Task):
    """Base class for async Celery tasks."""
    
    def run(self, *args, **kwargs):
        """Run the async task in a sync context."""
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(self._run_async(*args, **kwargs))
    
    async def _run_async(self, *args, **kwargs):
        """Async implementation to be overridden by subclasses."""
        raise NotImplementedError()

class ResearchTask(AsyncTask):
    """Task for running deep research."""
    
    async def _run_async(self, user_id: int, query: str) -> Dict[str, Any]:
        """Async implementation of deep research task."""
        research_service = ResearchService()
        
        try:
            result = await research_service.run_research_swarm(query)
            
            async with async_session_factory() as session:
                research_result = ResearchResult(
                    user_id=user_id,
                    original_question=result["original_question"],
                    scope_of_work=result["scope_of_work"],
                    summarized_result=result["summarized_result"],
                    raw_result=result["raw_result"]
                )
                
                session.add(research_result)
                await session.commit()
                
                # Update task result with research ID
                result["id"] = research_result.id
            
            return result
        except Exception as e:
            logger.error(f"Research task failed: {str(e)}")
            raise self.retry(exc=e, countdown=60)

# Register the task with Celery
@celery_app.task(base=ResearchTask)
def run_deep_research_task(user_id: int, query: str) -> Dict[str, Any]:
    """Run deep research task asynchronously."""
    # The actual implementation is in ResearchTask._run_async
    pass