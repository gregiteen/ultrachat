-- Create backup tables if they don't exist
CREATE TABLE IF NOT EXISTS threads_backup (
    id UUID PRIMARY KEY,
    user_id UUID,
    context_id UUID,
    title TEXT,
    pinned BOOLEAN,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS messages_backup (
    id UUID PRIMARY KEY,
    thread_id UUID,
    user_id UUID,
    context_id UUID,
    content TEXT,
    role TEXT,
    files TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Copy existing data to backup if tables exist
DO $$ 
BEGIN
  -- Try to copy threads
  BEGIN
    INSERT INTO threads_backup 
    SELECT * FROM threads 
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION 
    WHEN undefined_table THEN 
      RAISE NOTICE 'threads table does not exist yet';
  END;

  -- Try to copy messages
  BEGIN
    INSERT INTO messages_backup 
    SELECT * FROM messages 
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION 
    WHEN undefined_table THEN 
      RAISE NOTICE 'messages table does not exist yet';
  END;
END $$;

-- Add indexes to backup tables
CREATE INDEX IF NOT EXISTS idx_threads_backup_user_id ON threads_backup(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_backup_thread_id ON messages_backup(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_backup_user_id ON messages_backup(user_id);