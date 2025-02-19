/*
  # Add threads table and fix relationships
  
  1. Changes
    - Create threads table
    - Add foreign key constraint to messages.thread_id
    - Add RLS policies for threads
    - Add missing columns to threads table
*/

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text,
  pinned boolean DEFAULT false,
  personalization_enabled boolean DEFAULT false,
  search_enabled boolean DEFAULT false,
  tools_used text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS to threads table
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for threads
CREATE POLICY "Users can CRUD their own threads"
  ON threads
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint to messages
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_thread_id_fkey,
  ADD CONSTRAINT messages_thread_id_fkey
  FOREIGN KEY (thread_id)
  REFERENCES threads(id)
  ON DELETE CASCADE;

-- Add index for user_id on threads
CREATE INDEX IF NOT EXISTS threads_user_id_idx ON threads(user_id);

-- Add index for updated_at on threads
CREATE INDEX IF NOT EXISTS threads_updated_at_idx ON threads(updated_at DESC);

-- Add index for pinned threads
CREATE INDEX IF NOT EXISTS threads_pinned_idx ON threads(pinned DESC, updated_at DESC);

COMMENT ON TABLE threads IS 'Stores conversation threads';
COMMENT ON COLUMN threads.title IS 'AI-generated or user-provided title for the thread';
COMMENT ON COLUMN threads.pinned IS 'Whether the thread is pinned to the top';
COMMENT ON COLUMN threads.personalization_enabled IS 'Whether personalization is enabled for this thread';
COMMENT ON COLUMN threads.search_enabled IS 'Whether search is enabled for this thread';
COMMENT ON COLUMN threads.tools_used IS 'Array of tool identifiers used in this thread';