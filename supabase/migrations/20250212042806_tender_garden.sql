/*
  # Fix thread relationships and add performance optimizations

  1. Changes
    - Create threads for existing messages
    - Add foreign key constraint safely
    - Add performance indexes
  
  2. Details
    - Creates a thread for each unique thread_id in messages
    - Links messages to threads via foreign key
    - Adds indexes for common query patterns
*/

-- First, create threads for existing messages
INSERT INTO threads (id, user_id, context_id)
SELECT DISTINCT 
  m.thread_id,
  m.user_id,
  m.context_id
FROM messages m
LEFT JOIN threads t ON t.id = m.thread_id
WHERE t.id IS NULL;

-- Now we can safely add the foreign key constraint
ALTER TABLE messages
ADD CONSTRAINT messages_thread_id_fkey
FOREIGN KEY (thread_id)
REFERENCES threads(id)
ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS messages_user_thread_idx 
ON messages(user_id, thread_id);

CREATE INDEX IF NOT EXISTS threads_user_context_idx 
ON threads(user_id, context_id);

-- Add helpful comments
COMMENT ON CONSTRAINT messages_thread_id_fkey ON messages IS 'Links messages to their thread, cascade deletes when thread is removed';
COMMENT ON INDEX messages_user_thread_idx IS 'Improves performance of message queries by user and thread';
COMMENT ON INDEX threads_user_context_idx IS 'Improves performance of thread queries by user and context';