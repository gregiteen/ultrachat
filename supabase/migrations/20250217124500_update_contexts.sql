-- Create contexts table
CREATE TABLE IF NOT EXISTS contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ai_name TEXT NOT NULL,
    content TEXT NOT NULL,
    voice JSONB NOT NULL DEFAULT '{
        "name": "Default",
        "settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }'::jsonb,
    communication_preferences JSONB,
    learning_preferences JSONB,
    work_preferences JSONB,
    personalization_document TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contexts_user_id ON contexts(user_id);

-- Add RLS policies
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;

-- Context policies
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

-- Add updated_at trigger
CREATE TRIGGER set_contexts_updated_at
    BEFORE UPDATE ON contexts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();