-- Create ensure_tables function
CREATE OR REPLACE FUNCTION ensure_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create threads table if not exists
    CREATE TABLE IF NOT EXISTS threads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        context_id UUID,
        title TEXT NOT NULL,
        pinned BOOLEAN DEFAULT false,
        deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );

    -- Create messages table if not exists
    CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
        context_id UUID,
        content TEXT NOT NULL,
        role TEXT NOT NULL,
        files TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );

    -- Add indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
    CREATE INDEX IF NOT EXISTS idx_threads_context_id ON threads(context_id);
    CREATE INDEX IF NOT EXISTS idx_threads_pinned ON threads(pinned) WHERE pinned = true;
    CREATE INDEX IF NOT EXISTS idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
    CREATE INDEX IF NOT EXISTS idx_messages_context_id ON messages(context_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

    -- Enable RLS
    ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies if they don't exist
    DO $$
    BEGIN
        -- Threads policies
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'threads' 
            AND policyname = 'Users can view their own threads'
        ) THEN
            CREATE POLICY "Users can view their own threads"
                ON threads FOR SELECT
                USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'threads' 
            AND policyname = 'Users can insert their own threads'
        ) THEN
            CREATE POLICY "Users can insert their own threads"
                ON threads FOR INSERT
                WITH CHECK (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'threads' 
            AND policyname = 'Users can update their own threads'
        ) THEN
            CREATE POLICY "Users can update their own threads"
                ON threads FOR UPDATE
                USING (auth.uid() = user_id)
                WITH CHECK (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'threads' 
            AND policyname = 'Users can delete their own threads'
        ) THEN
            CREATE POLICY "Users can delete their own threads"
                ON threads FOR DELETE
                USING (auth.uid() = user_id);
        END IF;

        -- Messages policies
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND policyname = 'Users can view their own messages'
        ) THEN
            CREATE POLICY "Users can view their own messages"
                ON messages FOR SELECT
                USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND policyname = 'Users can insert their own messages'
        ) THEN
            CREATE POLICY "Users can insert their own messages"
                ON messages FOR INSERT
                WITH CHECK (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND policyname = 'Users can update their own messages'
        ) THEN
            CREATE POLICY "Users can update their own messages"
                ON messages FOR UPDATE
                USING (auth.uid() = user_id)
                WITH CHECK (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND policyname = 'Users can delete their own messages'
        ) THEN
            CREATE POLICY "Users can delete their own messages"
                ON messages FOR DELETE
                USING (auth.uid() = user_id);
        END IF;
    END
    $$;

    -- Grant permissions
    GRANT ALL ON threads TO authenticated;
    GRANT ALL ON messages TO authenticated;
    GRANT ALL ON threads TO postgres;
    GRANT ALL ON messages TO postgres;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ensure_tables TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_tables TO postgres;

-- Add function comment for PostgREST
COMMENT ON FUNCTION ensure_tables IS 'Ensures required tables exist with proper structure and permissions';

-- Enable RPC for PostgREST
ALTER FUNCTION ensure_tables() SET "pgrst.select" = '';