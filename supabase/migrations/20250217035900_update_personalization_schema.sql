-- Add personalization_document column
ALTER TABLE user_personalization
ADD COLUMN IF NOT EXISTS personalization_document JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_personalization_updated_at
    BEFORE UPDATE ON user_personalization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add index for faster personalization lookups
CREATE INDEX IF NOT EXISTS idx_user_personalization_user_id 
ON user_personalization(user_id);

-- Add index for personalization document queries
CREATE INDEX IF NOT EXISTS idx_user_personalization_document 
ON user_personalization USING gin(personalization_document);

-- Add index for is_active flag
CREATE INDEX IF NOT EXISTS idx_user_personalization_is_active 
ON user_personalization(is_active);

-- Add index for has_seen_welcome flag
CREATE INDEX IF NOT EXISTS idx_user_personalization_has_seen_welcome 
ON user_personalization(has_seen_welcome);