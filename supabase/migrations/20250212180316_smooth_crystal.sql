/*
  # Add AI Agent Support

  1. Changes
    - Add agent_status to tasks table
    - Add agent_notes to tasks table
    - Add agent_last_update to tasks table
    - Add indexes for agent-related queries

  2. Security
    - No changes to RLS policies needed
*/

-- Add agent-related columns to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS agent_status text CHECK (agent_status IN ('pending', 'in_progress', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS agent_notes text,
ADD COLUMN IF NOT EXISTS agent_last_update timestamptz;

-- Add index for agent queries
CREATE INDEX IF NOT EXISTS tasks_agent_status_idx ON tasks(user_id, agent_status);

-- Add helpful comments
COMMENT ON COLUMN tasks.agent_status IS 'Status of the AI agent''s progress on this task';
COMMENT ON COLUMN tasks.agent_notes IS 'Notes and updates from the AI agent about task progress';
COMMENT ON COLUMN tasks.agent_last_update IS 'Timestamp of the last agent update';