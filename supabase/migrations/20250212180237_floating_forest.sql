/*
  # Add title to threads table

  1. Changes
    - Add title column to threads table
    - Add index for faster title searches
    - Update comments and documentation

  2. Security
    - No changes to RLS policies needed
*/

-- Add title column to threads table
ALTER TABLE threads
ADD COLUMN IF NOT EXISTS title text;

-- Add index for title searches
CREATE INDEX IF NOT EXISTS threads_user_title_idx ON threads(user_id, title);

-- Add helpful comments
COMMENT ON COLUMN threads.title IS 'Title of the conversation thread, derived from first message';
COMMENT ON INDEX threads_user_title_idx IS 'Improves performance of thread queries filtered by user and title';

-- Update existing threads to have titles based on their first message
WITH first_messages AS (
  SELECT DISTINCT ON (thread_id)
    thread_id,
    content
  FROM messages
  WHERE role = 'user'
  ORDER BY thread_id, created_at ASC
)
UPDATE threads
SET title = CASE
  WHEN LENGTH(m.content) > 50 
  THEN LEFT(m.content, 47) || '...'
  ELSE m.content
END
FROM first_messages m
WHERE threads.id = m.thread_id
  AND threads.title IS NULL;