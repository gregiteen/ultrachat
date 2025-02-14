/*
  # Add default context support
  
  1. Changes
    - Add `is_default` column to contexts table
    - Add constraint to ensure only one default context per user
    - Add index for faster queries on is_default
*/

-- Add is_default column
ALTER TABLE contexts
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Add a unique constraint to ensure only one default context per user
CREATE UNIQUE INDEX IF NOT EXISTS contexts_user_default_idx 
ON contexts (user_id) 
WHERE is_default = true;

-- Add comment
COMMENT ON COLUMN contexts.is_default IS 'Flag indicating if this is the user''s default context. Only one context per user can be default.';