-- Enable RLS on threads table
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Create policy for reading threads
CREATE POLICY "Users can read their own threads"
  ON threads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for inserting threads
CREATE POLICY "Users can create their own threads"
  ON threads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for updating threads
CREATE POLICY "Users can update their own threads"
  ON threads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for soft deleting threads
CREATE POLICY "Users can soft delete their own threads"
  ON threads
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Create index for user_id to improve policy performance
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);