/*
  # Fix Tasks Table and RLS Policy

  1. Changes
    - Add priority field to tasks table
    - Fix RLS policy for tasks table
    - Add index for better performance
  
  2. Security
    - Update RLS policy to properly handle user authentication
*/

-- Add priority field to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium'
CHECK (priority IN ('low', 'medium', 'high'));

-- Drop existing RLS policy
DROP POLICY IF EXISTS "Users can CRUD their own tasks" ON tasks;

-- Create new RLS policy with proper user authentication
CREATE POLICY "Users can CRUD their own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS tasks_user_status_idx ON tasks(user_id, status);

-- Add helpful comments
COMMENT ON COLUMN tasks.priority IS 'Task priority level (low, medium, high)';
COMMENT ON INDEX tasks_user_status_idx IS 'Improves performance of task queries filtered by user and status';