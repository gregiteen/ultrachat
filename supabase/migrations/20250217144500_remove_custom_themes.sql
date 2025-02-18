-- Drop custom_themes table since themes are now stored in user_settings
DROP TABLE IF EXISTS custom_themes;

-- Ensure user_settings table exists with proper structure
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
    -- Users can view their own settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_settings' 
        AND policyname = 'Users can view their own settings'
    ) THEN
        CREATE POLICY "Users can view their own settings"
            ON user_settings FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    -- Users can insert their own settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_settings' 
        AND policyname = 'Users can insert their own settings'
    ) THEN
        CREATE POLICY "Users can insert their own settings"
            ON user_settings FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Users can update their own settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_settings' 
        AND policyname = 'Users can update their own settings'
    ) THEN
        CREATE POLICY "Users can update their own settings"
            ON user_settings FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Users can delete their own settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_settings' 
        AND policyname = 'Users can delete their own settings'
    ) THEN
        CREATE POLICY "Users can delete their own settings"
            ON user_settings FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END
$$;