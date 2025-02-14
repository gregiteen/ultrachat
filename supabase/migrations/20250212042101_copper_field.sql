/*
  # Add thread support to messages table

  1. Changes
    - Add thread_id column to messages table
    - Add index for faster thread-based queries
    - Update RLS policies to include thread_id

  2. Security
    - Maintain existing RLS policies
    - Users can only access their own threads
*/

-- Add thread_id column
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS thread_id uuid NOT NULL DEFAULT gen_random_uuid();

-- Add index for faster thread-based queries
CREATE INDEX IF NOT EXISTS messages_thread_id_idx ON messages(thread_id);

-- Add comment
COMMENT ON COLUMN messages.thread_id IS 'Unique identifier for the conversation thread';

-- Update RLS policy to include thread_id in the USING clause
DROP POLICY IF EXISTS "Users can CRUD their own messages" ON messages;

CREATE POLICY "Users can CRUD their own messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);