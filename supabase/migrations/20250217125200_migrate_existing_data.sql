-- Migrate existing threads and messages
DO $$ 
DECLARE
  old_thread RECORD;
  old_message RECORD;
BEGIN
  -- Create temporary table for old threads
  CREATE TEMP TABLE IF NOT EXISTS temp_threads AS
  SELECT * FROM threads_backup WHERE deleted_at IS NULL;

  -- Create temporary table for old messages
  CREATE TEMP TABLE IF NOT EXISTS temp_messages AS
  SELECT * FROM messages_backup;

  -- Migrate threads
  FOR old_thread IN SELECT * FROM temp_threads LOOP
    INSERT INTO threads (
      id,
      user_id,
      context_id,
      title,
      pinned,
      deleted_at,
      created_at,
      updated_at
    ) VALUES (
      old_thread.id,
      old_thread.user_id,
      old_thread.context_id,
      old_thread.title,
      old_thread.pinned,
      old_thread.deleted_at,
      old_thread.created_at,
      old_thread.updated_at
    ) ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      pinned = EXCLUDED.pinned,
      updated_at = EXCLUDED.updated_at;
  END LOOP;

  -- Migrate messages
  FOR old_message IN SELECT * FROM temp_messages LOOP
    INSERT INTO messages (
      id,
      thread_id,
      user_id,
      context_id,
      content,
      role,
      files,
      created_at,
      updated_at
    ) VALUES (
      old_message.id,
      old_message.thread_id,
      old_message.user_id,
      old_message.context_id,
      old_message.content,
      old_message.role,
      old_message.files,
      old_message.created_at,
      old_message.updated_at
    ) ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      files = EXCLUDED.files,
      updated_at = EXCLUDED.updated_at;
  END LOOP;

  -- Drop temporary tables
  DROP TABLE IF EXISTS temp_threads;
  DROP TABLE IF EXISTS temp_messages;
END $$;

-- Ensure RLS policies are properly set
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own threads" ON threads;
  DROP POLICY IF EXISTS "Users can insert their own threads" ON threads;
  DROP POLICY IF EXISTS "Users can update their own threads" ON threads;
  DROP POLICY IF EXISTS "Users can delete their own threads" ON threads;
  
  DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
  DROP POLICY IF EXISTS "Users can insert messages in their threads" ON messages;
  DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
  DROP POLICY IF EXISTS "Users can delete messages in their threads" ON messages;

  -- Recreate policies
  CREATE POLICY "Users can view their own threads"
    ON threads FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own threads"
    ON threads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own threads"
    ON threads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own threads"
    ON threads FOR DELETE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can view messages in their threads"
    ON messages FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert messages in their threads"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete messages in their threads"
    ON messages FOR DELETE
    USING (auth.uid() = user_id);
END $$;