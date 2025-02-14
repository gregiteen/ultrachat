/*
  # Add files column to contexts table

  1. Changes
    - Add `files` column to store file paths
    - Column type is text[] to store multiple file paths
    - Default to empty array
*/

ALTER TABLE contexts
ADD COLUMN IF NOT EXISTS files text[] DEFAULT '{}';

-- Update the comment to document the new column
COMMENT ON TABLE contexts IS 'Stores user context profiles with associated files';
COMMENT ON COLUMN contexts.files IS 'Array of file paths stored in the context-files bucket';