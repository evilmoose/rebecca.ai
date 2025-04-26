-- Drop the table if it exists (for clean recreation)
DROP TABLE IF EXISTS langgraph_checkpoints;

-- Create the table with proper JSONB columns
CREATE TABLE IF NOT EXISTS langgraph_checkpoints (
    id SERIAL PRIMARY KEY,  -- Add an explicit ID for easier management
    checkpoint_key JSONB NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create constraint to ensure checkpoint_key is unique
CREATE UNIQUE INDEX idx_langgraph_checkpoints_unique_key ON langgraph_checkpoints ((checkpoint_key->>'thread_id'));

-- Create GIN index for faster JSONB queries
CREATE INDEX idx_langgraph_checkpoint_key ON langgraph_checkpoints USING GIN (checkpoint_key);

-- Create a function to be used to test JSONB insertion
CREATE OR REPLACE FUNCTION test_jsonb_insert() 
RETURNS VOID AS $$
BEGIN
    INSERT INTO langgraph_checkpoints (checkpoint_key, state)
    VALUES ('{"thread_id": "test-thread-id"}'::jsonb, '{"messages": [], "context": {"type": "test"}}'::jsonb)
    ON CONFLICT ((checkpoint_key->>'thread_id')) DO UPDATE
    SET state = '{"messages": [], "context": {"type": "test-updated"}}'::jsonb;
END;
$$ LANGUAGE plpgsql; 