/*
  # Add thread-context association

  1. Changes
    - Add threads table to store thread metadata
    - Add context_id to threads table
    - Add foreign key constraint to ensure context_id references valid contexts
    - Add RLS policies for threads table

  2. Security
    - Enable RLS on threads table
    - Users can only access their own threads
*/

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  context_id uuid REFERENCES contexts,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can CRUD their own threads"
  ON threads
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS threads_context_id_idx ON threads(context_id);
CREATE INDEX IF NOT EXISTS threads_user_id_idx ON threads(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE threads IS 'Stores chat threads with optional context association';
COMMENT ON COLUMN threads.context_id IS 'Optional reference to the context used for this thread';