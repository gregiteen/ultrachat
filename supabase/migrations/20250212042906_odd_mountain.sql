/*
  # Add default context support
  
  1. Changes
    - Add is_default column to contexts table
    - Ensure only one default context per user
    - Handle existing contexts by setting the oldest one as default
  
  2. Security
    - Maintains existing RLS policies
*/

-- Add is_default column if it doesn't exist
ALTER TABLE contexts 
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Create a function to ensure only one default context per user
CREATE OR REPLACE FUNCTION ensure_single_default_context()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE contexts 
    SET is_default = false
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single default context
DROP TRIGGER IF EXISTS ensure_single_default_context_trigger ON contexts;
CREATE TRIGGER ensure_single_default_context_trigger
  BEFORE INSERT OR UPDATE OF is_default
  ON contexts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_context();

-- Set the oldest context as default for users who don't have one
DO $$
BEGIN
  UPDATE contexts c
  SET is_default = true
  WHERE c.id IN (
    SELECT DISTINCT ON (user_id) id
    FROM contexts
    WHERE NOT EXISTS (
      SELECT 1 
      FROM contexts c2 
      WHERE c2.user_id = contexts.user_id 
      AND c2.is_default = true
    )
    ORDER BY user_id, created_at ASC
  );
END $$;

-- Add comment
COMMENT ON COLUMN contexts.is_default IS 'Flag indicating if this is the user''s default context. Only one context per user can be default.';
COMMENT ON FUNCTION ensure_single_default_context() IS 'Ensures only one context per user can be marked as default';