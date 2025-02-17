-- Ensure all required tables exist
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

CREATE TABLE IF NOT EXISTS user_personalization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    context_id UUID,
    personal_info JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT false NOT NULL,
    has_seen_welcome BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS custom_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_id TEXT NOT NULL,
    name TEXT NOT NULL,
    colors JSONB NOT NULL,
    spacing JSONB NOT NULL,
    typography JSONB NOT NULL,
    animation JSONB NOT NULL,
    elevation JSONB NOT NULL,
    border_radius JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, theme_id)
);

CREATE TABLE IF NOT EXISTS contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ai_name TEXT NOT NULL,
    content TEXT NOT NULL,
    voice JSONB NOT NULL,
    communication_preferences JSONB,
    learning_preferences JSONB,
    work_preferences JSONB,
    personalization_document TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personalization ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own threads" ON threads;
DROP POLICY IF EXISTS "Users can insert their own threads" ON threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON threads;
DROP POLICY IF EXISTS "Users can delete their own threads" ON threads;

DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in their threads" ON messages;

DROP POLICY IF EXISTS "Users can view their own personalization" ON user_personalization;
DROP POLICY IF EXISTS "Users can update their own personalization" ON user_personalization;
DROP POLICY IF EXISTS "Users can insert their own personalization" ON user_personalization;

DROP POLICY IF EXISTS "Users can view their own custom themes" ON custom_themes;
DROP POLICY IF EXISTS "Users can insert their own custom themes" ON custom_themes;
DROP POLICY IF EXISTS "Users can update their own custom themes" ON custom_themes;
DROP POLICY IF EXISTS "Users can delete their own custom themes" ON custom_themes;

DROP POLICY IF EXISTS "Users can view their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can insert their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can update their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can delete their own contexts" ON contexts;

-- Create policies for threads
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

-- Create policies for messages
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

-- Create policies for user_personalization
CREATE POLICY "Users can view their own personalization"
    ON user_personalization FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own personalization"
    ON user_personalization FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personalization"
    ON user_personalization FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for custom_themes
CREATE POLICY "Users can view their own custom themes"
    ON custom_themes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom themes"
    ON custom_themes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom themes"
    ON custom_themes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom themes"
    ON custom_themes FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for contexts
CREATE POLICY "Users can view their own contexts"
    ON contexts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contexts"
    ON contexts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contexts"
    ON contexts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contexts"
    ON contexts FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_context_id ON threads(context_id);
CREATE INDEX IF NOT EXISTS idx_threads_pinned ON threads(pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_context_id ON messages(context_id);

CREATE INDEX IF NOT EXISTS idx_user_personalization_user_id ON user_personalization(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personalization_context_id ON user_personalization(context_id);

CREATE INDEX IF NOT EXISTS idx_custom_themes_user_id ON custom_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_themes_theme_id ON custom_themes(theme_id);

CREATE INDEX IF NOT EXISTS idx_contexts_user_id ON contexts(user_id);