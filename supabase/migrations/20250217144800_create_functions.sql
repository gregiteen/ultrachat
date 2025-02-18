-- Create ensure_threads_table function
CREATE OR REPLACE FUNCTION ensure_threads_table()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_thread_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- First check if user has any threads
    SELECT id INTO default_thread_id
    FROM threads 
    WHERE user_id = current_user_id 
    AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If user has a thread, return it
    IF default_thread_id IS NOT NULL THEN
        RETURN default_thread_id;
    END IF;
    
    -- Create new thread if none exist
    INSERT INTO threads (
        id,
        user_id,
        title,
        pinned,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        current_user_id,
        'New Chat',
        FALSE,
        now(),
        now()
    )
    RETURNING id INTO default_thread_id;

    -- Add welcome message
    INSERT INTO messages (
        thread_id,
        user_id,
        content,
        role,
        created_at,
        updated_at
    )
    VALUES (
        default_thread_id,
        current_user_id,
        'Welcome! How can I help you today?',
        'assistant',
        now(),
        now()
    );

    RETURN default_thread_id;
END;
$$;

-- Create ensure_messages_table function
CREATE OR REPLACE FUNCTION ensure_messages_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- No need to create default messages
    -- Just ensure the function exists for the application
    RETURN;
END;
$$;

-- Create reorder_threads function
CREATE OR REPLACE FUNCTION reorder_threads(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update thread order based on pinned status and creation date
    UPDATE threads
    SET updated_at = CASE 
        WHEN pinned THEN now()
        ELSE updated_at
    END
    WHERE user_id = user_id_param
    AND deleted_at IS NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ensure_threads_table TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_messages_table TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_threads TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_threads_table TO postgres;
GRANT EXECUTE ON FUNCTION ensure_messages_table TO postgres;
GRANT EXECUTE ON FUNCTION reorder_threads TO postgres;

-- Add function comments for PostgREST
COMMENT ON FUNCTION ensure_threads_table IS 'Returns the ID of the user''s most recent thread, creating one if none exist';
COMMENT ON FUNCTION ensure_messages_table IS 'Ensures messages table exists';
COMMENT ON FUNCTION reorder_threads IS 'Reorders threads based on pinned status';