-- Create backup tables if they don't exist
CREATE TABLE IF NOT EXISTS threads_backup (LIKE threads INCLUDING ALL);
CREATE TABLE IF NOT EXISTS messages_backup (LIKE messages INCLUDING ALL);

-- Copy data from main tables to backup if empty
INSERT INTO threads_backup 
SELECT * FROM threads 
WHERE NOT EXISTS (SELECT 1 FROM threads_backup LIMIT 1);

INSERT INTO messages_backup 
SELECT * FROM messages 
WHERE NOT EXISTS (SELECT 1 FROM messages_backup LIMIT 1);

-- Clear main tables
TRUNCATE threads CASCADE;
TRUNCATE messages CASCADE;

-- Migrate data back from backup
INSERT INTO threads 
SELECT * FROM threads_backup 
WHERE deleted_at IS NULL 
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  pinned = EXCLUDED.pinned,
  context_id = EXCLUDED.context_id,
  updated_at = EXCLUDED.updated_at;

INSERT INTO messages 
SELECT * FROM messages_backup 
WHERE thread_id IN (SELECT id FROM threads)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  files = EXCLUDED.files,
  context_id = EXCLUDED.context_id,
  updated_at = EXCLUDED.updated_at;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_threads_user_id_deleted_at 
ON threads(user_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_thread_id_user_id 
ON messages(thread_id, user_id);

-- Analyze tables
ANALYZE threads;
ANALYZE messages;