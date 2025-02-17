-- Drop and recreate tables to ensure correct structure
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS threads CASCADE;

-- Create threads table
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    context_id UUID,
    title TEXT NOT NULL,
    pinned BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    context_id UUID,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    files TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_pinned ON threads(pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- Enable RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own threads" ON threads;
DROP POLICY IF EXISTS "Users can insert their own threads" ON threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON threads;
DROP POLICY IF EXISTS "Users can delete their own threads" ON threads;

DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in their threads" ON messages;

-- Create thread policies
CREATE POLICY "Users can view their own threads"
    ON threads FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

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

-- Create message policies
CREATE POLICY "Users can view messages in their threads"
    ON messages FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT user_id FROM threads WHERE id = messages.thread_id
        )
    );

CREATE POLICY "Users can insert messages in their threads"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        auth.uid() IN (
            SELECT user_id FROM threads WHERE id = thread_id
        )
    );

CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete messages in their threads"
    ON messages FOR DELETE
    USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT user_id FROM threads WHERE id = messages.thread_id
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_threads_updated_at ON threads;
CREATE TRIGGER set_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_messages_updated_at ON messages;
CREATE TRIGGER set_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Migrate data from backup if exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'threads_backup') THEN
        INSERT INTO threads 
        SELECT * FROM threads_backup 
        WHERE deleted_at IS NULL 
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            pinned = EXCLUDED.pinned,
            context_id = EXCLUDED.context_id,
            updated_at = EXCLUDED.updated_at;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages_backup') THEN
        INSERT INTO messages 
        SELECT * FROM messages_backup 
        WHERE thread_id IN (SELECT id FROM threads)
        ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            files = EXCLUDED.files,
            context_id = EXCLUDED.context_id,
            updated_at = EXCLUDED.updated_at;
    END IF;
END $$;