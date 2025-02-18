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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_context_id ON threads(context_id);
CREATE INDEX IF NOT EXISTS idx_threads_pinned ON threads(pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add RLS policies
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own threads" ON threads;
DROP POLICY IF EXISTS "Users can insert their own threads" ON threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON threads;
DROP POLICY IF EXISTS "Users can delete their own threads" ON threads;

CREATE POLICY "Users can view their own threads"
    ON threads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threads"
    ON threads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
    ON threads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads"
    ON threads FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON threads TO authenticated;
GRANT ALL ON threads TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS threads_set_updated_at ON threads;
CREATE TRIGGER threads_set_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add table comment for PostgREST
COMMENT ON TABLE threads IS 'User chat threads';
COMMENT ON COLUMN threads.id IS 'The unique identifier for the thread';
COMMENT ON COLUMN threads.user_id IS 'The user who owns this thread';
COMMENT ON COLUMN threads.context_id IS 'Optional context ID for the thread';
COMMENT ON COLUMN threads.title IS 'The title of the thread';
COMMENT ON COLUMN threads.pinned IS 'Whether the thread is pinned';
COMMENT ON COLUMN threads.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN threads.created_at IS 'When the thread was created';
COMMENT ON COLUMN threads.updated_at IS 'When the thread was last updated';

-- Add PostgREST configuration
ALTER TABLE threads SET (security_invoker = on);
GRANT SELECT, INSERT, UPDATE, DELETE ON threads TO authenticated;