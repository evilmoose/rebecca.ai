  CREATE TABLE IF NOT EXISTS threads (
       thread_id UUID PRIMARY KEY,
       user_id INT NOT NULL REFERENCES users(id),
       title VARCHAR(255),
       context_type VARCHAR(50) NOT NULL DEFAULT 'general_chat',
       task_type VARCHAR(50),
       created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
       last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
       is_archived BOOLEAN NOT NULL DEFAULT FALSE
   );

   CREATE INDEX idx_threads_user_id ON threads(user_id);
   CREATE INDEX idx_threads_last_activity ON threads(last_activity_at);