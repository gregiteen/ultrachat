-- Create custom themes table
CREATE TABLE custom_themes (
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

-- Add RLS policies
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;

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

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON custom_themes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();