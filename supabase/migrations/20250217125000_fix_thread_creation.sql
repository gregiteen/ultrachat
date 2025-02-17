-- Drop existing thread creation policy
DROP POLICY IF EXISTS "Users can create their own threads" ON threads;

-- Create updated policy for thread creation that handles personalization edge cases
CREATE POLICY "Users can create their own threads"
  ON threads
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      -- Allow if context_id is null
      context_id IS NULL 
      OR 
      -- Allow if personalization is not active
      NOT EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = auth.uid() 
        AND up.is_active = true
      )
      OR
      -- Allow if context matches active personalization
      EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = auth.uid() 
        AND up.is_active = true 
        AND (
          -- Allow if either context matches or personalization has no context yet
          context_id = up.context_id 
          OR up.context_id IS NULL
        )
      )
    )
  );

-- Add index to optimize policy performance
CREATE INDEX IF NOT EXISTS idx_user_personalization_context 
  ON user_personalization(user_id, is_active, context_id);

-- Add function to ensure thread has valid context
CREATE OR REPLACE FUNCTION check_thread_context()
RETURNS TRIGGER AS $$
BEGIN
  -- If no context_id is provided and personalization is active,
  -- use the personalization context
  IF NEW.context_id IS NULL THEN
    SELECT context_id INTO NEW.context_id
    FROM user_personalization
    WHERE user_id = NEW.user_id
    AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically set context
DROP TRIGGER IF EXISTS set_thread_context ON threads;
CREATE TRIGGER set_thread_context
  BEFORE INSERT ON threads
  FOR EACH ROW
  EXECUTE FUNCTION check_thread_context();