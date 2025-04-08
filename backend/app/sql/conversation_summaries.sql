CREATE TABLE conversation_summaries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    summary TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);