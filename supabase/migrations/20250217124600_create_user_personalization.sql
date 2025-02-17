-- Create user_personalization table
CREATE TABLE IF NOT EXISTS user_personalization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    personal_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT false,
    has_seen_welcome BOOLEAN NOT NULL DEFAULT false,
    personalization_document TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_personalization_user_id ON user_personalization(user_id);

-- Add RLS policies
ALTER TABLE user_personalization ENABLE ROW LEVEL SECURITY;

-- User personalization policies
CREATE POLICY "Users can view their own personalization"
    ON user_personalization FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personalization"
    ON user_personalization FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personalization"
    ON user_personalization FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personalization"
    ON user_personalization FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER set_user_personalization_updated_at
    BEFORE UPDATE ON user_personalization
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();