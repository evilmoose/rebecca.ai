# langgraph_chat_service.py

from langchain_core.messages import HumanMessage, ToolMessage, AIMessage
from typing import Dict, Any, AsyncGenerator, List, Optional
from app.graph.unified_graph import get_graph
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db
from fastapi import Depends
from app.services.checkpoint_service import CheckpointService
from app.services.thread_service import ThreadService
import json
import logging

# Helper function to serialize LangChain messages
def serialize_messages(obj):
    if hasattr(obj, 'to_json'):
        return obj.to_json()
    elif hasattr(obj, '__dict__'):
        return obj.__dict__
    else:
        return str(obj)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LangGraphChatService:
    def __init__(self, db: AsyncSession = None):
        self.graph = get_graph()
        self.db = db
        self.checkpoint_service = CheckpointService(db) if db else None
        self.thread_service = ThreadService(db) if db else None

    async def stream_response(
        self, 
        message: str, 
        thread_id: str, 
        context_type: str = "general_chat", 
        task_type: str = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        user_message = HumanMessage(content=message)
        
        # Log context information
        logger.info(f"Processing request for thread_id={thread_id}, context_type={context_type}, task_type={task_type}")
        
        # Create checkpoint key from thread_id
        checkpoint_key = {"thread_id": thread_id}
        
        # Create config with thread info
        config = {
            "configurable": {
                "thread_id": thread_id,
                "context_type": context_type,
                "task_type": task_type
            }
        }
        
        # Try to get existing state from checkpoint
        try:
            if self.db and self.checkpoint_service:
                # Get existing checkpoint data
                state = await self.checkpoint_service.get_checkpoint(checkpoint_key)
                
                if state:
                    # Need to properly deserialize messages from the checkpoint
                    messages = []
                    raw_messages = state.get("messages", [])
                    
                    for msg in raw_messages:
                        if isinstance(msg, dict):
                            # Handle different message formats
                            if "type" in msg and msg["type"] == "human":
                                messages.append(HumanMessage(content=msg.get("content", "")))
                            elif "type" in msg and msg["type"] == "ai":
                                messages.append(AIMessage(content=msg.get("content", "")))
                            elif "type" in msg and msg["type"] == "tool":
                                messages.append(ToolMessage(content=msg.get("content", ""), tool_call_id=msg.get("tool_call_id", "")))
                            # Handle LangChain serialized messages
                            elif "kwargs" in msg and isinstance(msg["kwargs"], dict):
                                content = msg["kwargs"].get("content", "")
                                msg_type = msg["kwargs"].get("type", "")
                                
                                if msg_type == "human":
                                    messages.append(HumanMessage(content=content))
                                elif msg_type == "ai":
                                    messages.append(AIMessage(content=content))
                                elif msg_type == "tool":
                                    tool_id = msg["kwargs"].get("tool_call_id", "")
                                    messages.append(ToolMessage(content=content, tool_call_id=tool_id))
                            else:
                                # Try to infer message type from structure
                                content = msg.get("content", "")
                                if any(user_term in str(msg).lower() for user_term in ["human", "user"]):
                                    messages.append(HumanMessage(content=content))
                                else:
                                    messages.append(AIMessage(content=content))
                    
                    # Add new message
                    messages.append(user_message)
                    
                    # Recreate state with proper message objects
                    state = {
                        "messages": messages,
                        "context": {
                            "type": context_type,
                            "task": task_type
                        },
                        "task_flags": state.get("task_flags", {})
                    }
                    
                    logger.info(f"Retrieved existing checkpoint for thread_id={thread_id}")
                else:
                    # Initialize new state if no checkpoint found
                    logger.info(f"No checkpoint found for thread_id={thread_id}, creating new state")
                    state = {
                        "messages": [user_message],
                        "context": {
                            "type": context_type,
                            "task": task_type
                        },
                        "task_flags": {}
                    }
            else:
                # Try to get state from graph memory if no DB
                try:
                    current_state = self.graph.get_state({"configurable": {"thread_id": thread_id}})
                    state = {"messages": current_state.get("messages", []) + [user_message]}
                except:
                    state = {"messages": [user_message]}
                
                # Add context
                state["context"] = {
                    "type": context_type,
                    "task": task_type
                }
                state["task_flags"] = state.get("task_flags", {})
                logger.info(f"Using in-memory state for thread_id={thread_id}")
        except Exception as e:
            logger.error(f"Error retrieving checkpoint: {e}")
            # Initialize new state on error
            state = {
                "messages": [user_message],
                "context": {
                    "type": context_type,
                    "task": task_type
                },
                "task_flags": {}
            }
        
        # Update thread last activity
        if self.db and self.thread_service:
            try:
                await self.thread_service.update_thread_activity(thread_id)
                logger.info(f"Updated last_activity_at for thread_id={thread_id}")
            except Exception as e:
                logger.error(f"Error updating thread activity: {e}")
        
        # Stream response from graph
        tool_outputs = []
        logger.info(f"Streaming response from graph for thread_id={thread_id}, context={state['context']}")
        
        async for event in self.graph.astream(state, config=config, stream_mode="values"):
            # Store checkpoint after each event if DB is available
            if self.db and self.checkpoint_service:
                try:
                    # Save the checkpoint
                    await self.checkpoint_service.save_checkpoint(checkpoint_key, event)
                except Exception as e:
                    logger.error(f"Error storing checkpoint: {e}")
            
            # Process any new messages
            for msg in event.get("messages", []):
                if isinstance(msg, ToolMessage):
                    tool_outputs.append(msg.content)
                    yield {
                        "content": msg.content,
                        "type": "tool_output",
                        "tool_name": msg.tool_call_id,
                        "complete": True
                    }
                elif isinstance(msg, AIMessage):
                    yield {
                        "content": msg.content,
                        "type": "response",
                        "complete": False
                    }

        # Final response
        logger.info(f"Completed response for thread_id={thread_id}")
        yield {
            "content": "",
            "type": "response",
            "complete": True,
            "tool_outputs": tool_outputs if tool_outputs else None
        }

    async def reset_thread(self, thread_id: str) -> bool:
        logger.info(f"Resetting thread_id={thread_id}")
        success = True
        
        # Delete checkpoint for this thread if DB is available
        if self.db and self.checkpoint_service:
            checkpoint_key = {"thread_id": thread_id}
            try:
                success = await self.checkpoint_service.delete_checkpoint(checkpoint_key)
                # Initialize a new empty checkpoint
                if success:
                    await self.checkpoint_service.initialize_empty_checkpoint(
                        thread_id=thread_id,
                        context_type="general_chat"
                    )
                logger.info(f"Reset checkpoint for thread_id={thread_id}")
            except Exception as e:
                logger.error(f"Error resetting checkpoint: {e}")
                success = False
        
        # Also reset in-memory state
        try:
            self.graph.update_state({"configurable": {"thread_id": thread_id}}, {"messages": []})
            logger.info(f"Reset in-memory state for thread_id={thread_id}")
        except Exception as e:
            logger.error(f"Error resetting in-memory state: {e}")
            success = False
            
        return success 