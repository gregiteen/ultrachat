-- Add context_id to user_personalization
ALTER TABLE user_personalization
ADD COLUMN context_id uuid REFERENCES contexts(id) ON DELETE SET NULL;

-- Update RLS policies to include context_id
DROP POLICY IF EXISTS "Users can view their own personalization" ON user_personalization;
DROP POLICY IF EXISTS "Users can update their own personalization" ON user_personalization;
DROP POLICY IF EXISTS "Users can insert their own personalization" ON user_personalization;

CREATE POLICY "Users can view their own personalization"
  ON user_personalization
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own personalization"
  ON user_personalization
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personalization"
  ON user_personalization
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update create_user_personalization function to include context_id
CREATE OR REPLACE FUNCTION create_user_personalization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_personalization (
    user_id,
    personal_info,
    is_active,
    has_seen_welcome,
    context_id
  )
  VALUES (
    NEW.id,
    '{}'::jsonb,
    false,
    false,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create index for context_id
CREATE INDEX IF NOT EXISTS idx_user_personalization_context_id ON user_personalization(context_id);