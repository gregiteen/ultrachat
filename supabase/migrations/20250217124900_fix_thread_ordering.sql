-- Add index for thread ordering
CREATE INDEX IF NOT EXISTS idx_threads_order ON threads("order", created_at DESC);

-- Add index for personalization context
CREATE INDEX IF NOT EXISTS idx_threads_context ON threads(user_id, context_id);

-- Drop existing thread policies
DROP POLICY IF EXISTS "Users can read their own threads" ON threads;
DROP POLICY IF EXISTS "Users can create their own threads" ON threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON threads;
DROP POLICY IF EXISTS "Users can soft delete their own threads" ON threads;

-- Create updated policies with proper context handling
CREATE POLICY "Users can read their own threads"
  ON threads
  FOR SELECT
  USING (
    auth.uid() = user_id 
    AND deleted_at IS NULL
    AND (
      context_id IS NULL 
      OR EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = auth.uid() 
        AND (up.is_active = false OR context_id = up.context_id)
      )
    )
  );

CREATE POLICY "Users can create their own threads"
  ON threads
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      context_id IS NULL 
      OR EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = auth.uid() 
        AND (up.is_active = false OR context_id = up.context_id)
      )
    )
  );

CREATE POLICY "Users can update their own threads"
  ON threads
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND deleted_at IS NULL
    AND (
      context_id IS NULL 
      OR EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = auth.uid() 
        AND (up.is_active = false OR context_id = up.context_id)
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      context_id IS NULL 
      OR EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = auth.uid() 
        AND (up.is_active = false OR context_id = up.context_id)
      )
    )
  );

CREATE POLICY "Users can soft delete their own threads"
  ON threads
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND deleted_at IS NULL
    AND (
      context_id IS NULL 
      OR EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = auth.uid() 
        AND (up.is_active = false OR context_id = up.context_id)
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      context_id IS NULL 
      OR EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = auth.uid() 
        AND (up.is_active = false OR context_id = up.context_id)
      )
    )
  );

-- Update thread ordering function to handle context
CREATE OR REPLACE FUNCTION reorder_threads(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  thread_record RECORD;
  current_order INTEGER := 1;
  user_context_id UUID;
BEGIN
  -- Get user's current context
  SELECT context_id INTO user_context_id
  FROM user_personalization
  WHERE user_id = user_id_param
  AND is_active = true;

  -- First update pinned threads
  FOR thread_record IN (
    SELECT id
    FROM threads
    WHERE user_id = user_id_param
    AND deleted_at IS NULL
    AND pinned = true
    AND (
      context_id IS NULL 
      OR context_id = user_context_id 
      OR NOT EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = user_id_param 
        AND up.is_active = true
      )
    )
    ORDER BY created_at DESC
  )
  LOOP
    UPDATE threads
    SET "order" = current_order
    WHERE id = thread_record.id;
    
    current_order := current_order + 1;
  END LOOP;

  -- Then update unpinned threads
  FOR thread_record IN (
    SELECT id
    FROM threads
    WHERE user_id = user_id_param
    AND deleted_at IS NULL
    AND pinned = false
    AND (
      context_id IS NULL 
      OR context_id = user_context_id 
      OR NOT EXISTS (
        SELECT 1 FROM user_personalization up 
        WHERE up.user_id = user_id_param 
        AND up.is_active = true
      )
    )
    ORDER BY created_at DESC
  )
  LOOP
    UPDATE threads
    SET "order" = current_order
    WHERE id = thread_record.id;
    
    current_order := current_order + 1;
  END LOOP;
END;
$$;