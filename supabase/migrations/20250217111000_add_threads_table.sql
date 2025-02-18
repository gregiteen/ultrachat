-- Create threads table
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

-- Add thread_id to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES threads;

-- Create ensure_tables function
CREATE OR REPLACE FUNCTION ensure_tables()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create threads table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'threads') THEN
    CREATE TABLE threads (
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
  END IF;

  -- Add thread_id to messages if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE messages
    ADD COLUMN thread_id uuid REFERENCES threads;
  END IF;
END;
$$;

-- Create trigger for updated_at on threads
CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_pinned ON threads(pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);