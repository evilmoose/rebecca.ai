"""
Script to reset and test the langgraph_checkpoints table
"""
import asyncio
import os
import sys

# Add the parent directory to the path so we can import our app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.core.db import engine, async_session_factory

async def reset_checkpoints_table():
    """Drop and recreate the langgraph_checkpoints table with the correct structure"""
    print("🔄 Resetting langgraph_checkpoints table...")
    
    # Split SQL into individual statements
    statements = [
        # Drop existing table
        "DROP TABLE IF EXISTS langgraph_checkpoints;",
        
        # Create table
        """
        CREATE TABLE IF NOT EXISTS langgraph_checkpoints (
            id SERIAL PRIMARY KEY,
            checkpoint_key JSONB NOT NULL,
            state JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        """,
        
        # Create unique index
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_langgraph_checkpoints_unique_key 
        ON langgraph_checkpoints ((checkpoint_key->>'thread_id'));
        """,
        
        # Create GIN index
        """
        CREATE INDEX IF NOT EXISTS idx_langgraph_checkpoint_key 
        ON langgraph_checkpoints USING GIN (checkpoint_key);
        """
    ]
    
    # Execute each statement individually
    async with engine.begin() as conn:
        for i, statement in enumerate(statements):
            try:
                await conn.execute(text(statement))
                print(f"✅ Statement {i+1}/{len(statements)} executed successfully")
            except Exception as e:
                print(f"❌ Error executing statement {i+1}: {e}")
                raise
    
    print("✅ Table reset successfully")
    
    # Test inserting and retrieving JSONB data
    print("\n🧪 Testing JSONB operations...")
    
    # Create a test checkpoint
    checkpoint_key = {"thread_id": "test-thread-123"}
    test_state = {
        "messages": [{"role": "user", "content": "Hello"}],
        "context": {"type": "test", "task": None},
        "task_flags": {}
    }
    
    async with async_session_factory() as session:
        try:
            # Insert test data - use direct JSON casting for PostgreSQL
            insert_query = """
            INSERT INTO langgraph_checkpoints (checkpoint_key, state) 
            VALUES (cast(:key as jsonb), cast(:state as jsonb))
            """
            
            # Convert Python dicts to JSON strings
            import json
            serialized_key = json.dumps(checkpoint_key)
            serialized_state = json.dumps(test_state)
            
            await session.execute(
                text(insert_query), 
                {"key": serialized_key, "state": serialized_state}
            )
            await session.commit()
            print("✅ Test data inserted")
            
            # Retrieve the test data
            select_query = """
            SELECT checkpoint_key, state 
            FROM langgraph_checkpoints 
            WHERE checkpoint_key->>'thread_id' = :thread_id
            """
            result = await session.execute(text(select_query), {"thread_id": "test-thread-123"})
            row = result.fetchone()
            
            if row:
                print("✅ Test data retrieved successfully:")
                print(f"  Key: {row[0]}")
                print(f"  State: {row[1]}")
            else:
                print("❌ Failed to retrieve test data")
                
            # Count rows
            count_query = "SELECT COUNT(*) FROM langgraph_checkpoints"
            count_result = await session.execute(text(count_query))
            count = count_result.scalar()
            print(f"✅ Total rows in table: {count}")
            
            # Clean up test data
            clean_query = "DELETE FROM langgraph_checkpoints WHERE checkpoint_key->>'thread_id' = :thread_id"
            await session.execute(text(clean_query), {"thread_id": "test-thread-123"})
            await session.commit()
            print("✅ Test data cleaned up")
            
        except Exception as e:
            print(f"❌ Error during test: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(reset_checkpoints_table()) 