"""
/app/worker.py
Celery worker configuration and initialization.
"""
from celery import Celery
from celery.signals import worker_init, worker_process_init
import asyncio
from app.core.config import settings
from app.core.logging import setup_logging

# Configure Celery app
celery_app = Celery(
    "research_worker",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
)

# Import Celery tasks
celery_app.autodiscover_tasks(['app.services.tasks'])

# Configure Celery settings
celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Queue settings
    task_queues={
        'research': {
            'exchange': 'research',
            'routing_key': 'research.#',
        }
    },
    
    # Route tasks to specific queues
    task_routes={
        'app.services.tasks.run_deep_research_task': {'queue': 'research'},
    },
    
    # Task execution settings
    task_time_limit=3600,  # 1 hour max
    task_soft_time_limit=3300,  # 55 minutes soft limit
    
    # Worker settings
    worker_prefetch_multiplier=1,  # One task at a time
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks
    
    # Result backend settings
    result_expires=3600 * 24 * 7,  # Results expire after 1 week
    
    # Error handling
    task_acks_late=True,  # Only acknowledge after task completion
    task_reject_on_worker_lost=True,  # Reject task if worker dies
)

# Set up logging for workers
logger = setup_logging()

@worker_init.connect
def init_worker(**kwargs):
    """Initialize worker process."""
    logger.info("Initializing Celery worker")

@worker_process_init.connect
def init_worker_process(**kwargs):
    """Initialize each worker process."""
    # Create new event loop for async operations
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    logger.info("Initialized worker process with new event loop")

if __name__ == '__main__':
    celery_app.start()