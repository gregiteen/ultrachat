-- Create function to reorder threads
CREATE OR REPLACE FUNCTION reorder_threads(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  thread_record RECORD;
  current_order INTEGER := 1;
BEGIN
  -- First update pinned threads
  FOR thread_record IN (
    SELECT id
    FROM threads
    WHERE user_id = user_id_param
    AND deleted_at IS NULL
    AND pinned = true
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