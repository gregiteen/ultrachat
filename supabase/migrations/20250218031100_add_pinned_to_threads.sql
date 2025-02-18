-- Add pinned column to threads table
ALTER TABLE threads ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- Add index for pinned column
CREATE INDEX IF NOT EXISTS idx_threads_pinned ON threads(pinned);

-- Update RLS policies to include pinned column
DROP POLICY IF EXISTS "Users can update their own threads" ON threads;
CREATE POLICY "Users can update their own threads"
  ON threads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);