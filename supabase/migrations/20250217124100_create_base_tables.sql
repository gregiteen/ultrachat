-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
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
CREATE TABLE IF NOT EXISTS messages (
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
CREATE INDEX IF NOT EXISTS idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- Add RLS policies
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Thread policies
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

-- Message policies
CREATE POLICY "Users can view messages in their threads"
    ON messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages in their threads"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete messages in their threads"
    ON messages FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();