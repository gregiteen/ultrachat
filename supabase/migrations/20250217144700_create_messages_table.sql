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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_context_id ON messages(context_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Add RLS policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
    ON messages FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS messages_set_updated_at ON messages;
CREATE TRIGGER messages_set_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add table comment for PostgREST
COMMENT ON TABLE messages IS 'Chat messages';
COMMENT ON COLUMN messages.id IS 'The unique identifier for the message';
COMMENT ON COLUMN messages.user_id IS 'The user who owns this message';
COMMENT ON COLUMN messages.thread_id IS 'The thread this message belongs to';
COMMENT ON COLUMN messages.context_id IS 'Optional context ID for the message';
COMMENT ON COLUMN messages.content IS 'The content of the message';
COMMENT ON COLUMN messages.role IS 'The role of the message sender (user/assistant/system)';
COMMENT ON COLUMN messages.files IS 'Array of file references attached to the message';
COMMENT ON COLUMN messages.created_at IS 'When the message was created';
COMMENT ON COLUMN messages.updated_at IS 'When the message was last updated';

-- Add PostgREST configuration
ALTER TABLE messages SET (security_invoker = on);
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;