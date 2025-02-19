-- Create threads table
CREATE TABLE threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  pinned boolean DEFAULT false,
  context_id uuid REFERENCES contexts,
  personalization_enabled boolean DEFAULT false,
  search_enabled boolean DEFAULT false,
  tools_used text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Enable RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Add policy for authenticated users
CREATE POLICY "Users can CRUD their own threads"
  ON threads
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_threads_pinned ON threads(pinned) WHERE pinned = true;
CREATE INDEX idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update messages table to reference threads
ALTER TABLE messages
ADD COLUMN thread_id uuid REFERENCES threads,
ADD COLUMN files text[] DEFAULT ARRAY[]::text[];

-- Add index for messages
CREATE INDEX idx_messages_thread_id ON messages(thread_id);