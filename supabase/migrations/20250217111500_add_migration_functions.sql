-- Function to create threads table
CREATE OR REPLACE FUNCTION create_threads_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    title text NOT NULL,
    pinned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz DEFAULT NULL
  );

  ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can CRUD their own threads"
    ON threads
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
  CREATE INDEX IF NOT EXISTS idx_threads_pinned ON threads(pinned) WHERE pinned = true;
  CREATE INDEX IF NOT EXISTS idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NOT NULL;

  -- Create trigger for updated_at
  CREATE TRIGGER update_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END;
$$;

-- Function to add thread_id to messages
CREATE OR REPLACE FUNCTION add_thread_id_to_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES threads;

  CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
END;
$$;

-- Function to ensure tables exist
CREATE OR REPLACE FUNCTION ensure_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create threads table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'threads') THEN
    PERFORM create_threads_table();
  END IF;

  -- Add thread_id to messages if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'thread_id'
  ) THEN
    PERFORM add_thread_id_to_messages();
  END IF;
END;
$$;