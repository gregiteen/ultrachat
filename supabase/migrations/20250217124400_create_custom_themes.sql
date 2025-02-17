-- Create custom themes table
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_custom_themes_user_id ON custom_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_themes_theme_id ON custom_themes(theme_id);

-- Add RLS policies
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;

-- Theme policies
CREATE POLICY "Users can view their own themes"
    ON custom_themes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own themes"
    ON custom_themes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own themes"
    ON custom_themes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own themes"
    ON custom_themes FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER set_custom_themes_updated_at
    BEFORE UPDATE ON custom_themes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();