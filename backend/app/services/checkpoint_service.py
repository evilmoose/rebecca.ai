from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Dict, Any, Optional
import json
import logging
import traceback

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CheckpointService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def save_checkpoint(self, checkpoint_key: Dict[str, Any], state: Dict[str, Any]) -> bool:
        """Save a checkpoint to the database"""
        try:
            # Serialize both objects to JSON strings
            serialized_key = json.dumps(checkpoint_key)
            serialized_state = json.dumps(state, default=self._serialize_objects)
            
            logger.info(f"Attempting to save checkpoint with key: {serialized_key[:50]}...")
            
            # Use simple PostgreSQL-compatible approach to JSONB handling
            query = text("""
            INSERT INTO langgraph_checkpoints (checkpoint_key, state) 
            VALUES (cast(:key as jsonb), cast(:state as jsonb)) 
            ON CONFLICT ((checkpoint_key->>'thread_id')) DO UPDATE 
            SET state = cast(:state as jsonb), created_at = NOW()
            """)
            
            # Execute the query with the proper parameters
            await self.db.execute(
                query,
                {"key": serialized_key, "state": serialized_state}
            )
            
            # Always explicitly commit the transaction
            await self.db.commit()
            
            # Log success with thread_id for easier debugging
            thread_id = checkpoint_key.get("thread_id", "unknown")
            logger.info(f"✅ Checkpoint saved successfully for thread: {thread_id}")
            return True
                
        except Exception as e:
            logger.error(f"Error saving checkpoint: {e}")
            logger.error(traceback.format_exc())
            await self.db.rollback()
            return False
    
    async def get_checkpoint(self, key: Dict):
        """
        Retrieve a checkpoint by key.
        
        Args:
            key: Dictionary containing at least thread_id
            
        Returns:
            The checkpoint state or None if not found
        """
        thread_id = key.get("thread_id")
        if not thread_id:
            logging.error("Missing thread_id in checkpoint key")
            return None
            
        try:
            logging.info(f"Retrieving checkpoint for thread_id: {thread_id}")
            
            # Fetch checkpoint using direct thread_id match
            query = text("""
                SELECT state 
                FROM langgraph_checkpoints
                WHERE checkpoint_key ->> 'thread_id' = :thread_id
                LIMIT 1
            """)
            
            result = await self.db.execute(
                query,
                {"thread_id": thread_id}
            )
            
            checkpoint = result.fetchone()
            
            if checkpoint:
                state = checkpoint.state
                logging.info(f"Found checkpoint for thread_id: {thread_id}")
                # Log a preview of the state structure for debugging
                if isinstance(state, dict):
                    keys = list(state.keys())
                    msg_count = len(state.get("messages", []))
                    logging.info(f"State keys: {keys}, message count: {msg_count}")
                    
                    # Log a sample of the message structure
                    if "messages" in state and state["messages"]:
                        sample_msg = state["messages"][0]
                        logging.info(f"Sample message structure: {str(sample_msg)[:200]}...")
                return state
            else:
                logging.warning(f"No checkpoint found for thread_id: {thread_id}")
                return None
                
        except Exception as e:
            logging.error(f"Error retrieving checkpoint: {e}")
            raise
    
    async def delete_checkpoint(self, checkpoint_key: Dict[str, Any]) -> bool:
        """Delete a checkpoint from the database"""
        try:
            # Get the thread_id for direct access
            thread_id = checkpoint_key.get("thread_id", "")
            if not thread_id:
                logger.error("No thread_id in checkpoint key")
                return False
                
            logger.info(f"Attempting to delete checkpoint for thread: {thread_id}")
            
            # Use direct key match on thread_id instead of using the @> operator
            query = text("""
            DELETE FROM langgraph_checkpoints 
            WHERE checkpoint_key->>'thread_id' = :thread_id
            """)
            
            result = await self.db.execute(query, {"thread_id": thread_id})
            await self.db.commit()
            
            # Check how many rows were affected
            rows_deleted = result.rowcount if hasattr(result, 'rowcount') else 0
            
            if rows_deleted > 0:
                logger.info(f"✅ Deleted checkpoint successfully for thread: {thread_id}")
                return True
            else:
                logger.warn(f"⚠️ No checkpoint found to delete for thread: {thread_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting checkpoint: {e}")
            logger.error(traceback.format_exc())
            await self.db.rollback()
            return False
    
    async def initialize_empty_checkpoint(self, thread_id: str, context_type: str, task_type: Optional[str] = None) -> bool:
        """Initialize an empty checkpoint for a new thread"""
        try:
            # Create an empty state structure
            empty_state = {
                "messages": [],
                "context": {
                    "type": context_type,
                    "task": task_type
                },
                "task_flags": {}
            }
            
            # Create checkpoint key with thread_id
            checkpoint_key = {"thread_id": thread_id}
            
            logger.info(f"Initializing empty checkpoint for thread: {thread_id}")
            
            # Save the empty checkpoint
            success = await self.save_checkpoint(checkpoint_key, empty_state)
            if success:
                logger.info(f"✅ Initialized empty checkpoint for thread: {thread_id}")
            else:
                logger.error(f"Failed to initialize empty checkpoint for thread: {thread_id}")
            return success
                
        except Exception as e:
            logger.error(f"Error initializing empty checkpoint: {e}")
            logger.error(traceback.format_exc())
            return False
    
    async def get_latest_checkpoint_for_thread(self, thread_id: str) -> Dict[str, Any]:
        """
        Retrieve the latest checkpoint for a thread
        
        Args:
            thread_id: The thread ID to get the checkpoint for
            
        Returns:
            The checkpoint state or None if not found
        """
        try:
            logger.info(f"Retrieving latest checkpoint for thread: {thread_id}")
            
            # Create the checkpoint key with thread_id
            checkpoint_key = {"thread_id": thread_id}
            
            # Get the checkpoint using the existing method
            return await self.get_checkpoint(checkpoint_key)
            
        except Exception as e:
            logger.error(f"Error retrieving latest checkpoint for thread {thread_id}: {e}")
            logger.error(traceback.format_exc())
            return None
    
    def _serialize_objects(self, obj):
        """Custom JSON serializer that handles special objects"""
        try:
            # Add support for any special object types that need custom serialization
            if hasattr(obj, "__dict__"):
                return obj.__dict__
            if hasattr(obj, "isoformat"):  # For datetime objects
                return obj.isoformat()
            return str(obj)  # Fallback for other non-serializable objects
        except Exception as e:
            logger.error(f"Error serializing object: {e}")
            return str(obj)  # Fallback to string representation 