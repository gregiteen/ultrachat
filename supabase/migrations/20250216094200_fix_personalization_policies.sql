-- Add policy for upsert operations
CREATE POLICY "Users can upsert their own personalization"
  ON user_personalization
  FOR INSERT
  WITH CHECK (auth.uid() = user_id)
  USING (auth.uid() = user_id);

-- Drop and recreate update policy to be more permissive
DROP POLICY IF EXISTS "Users can update their own personalization" ON user_personalization;

CREATE POLICY "Users can update their own personalization"
  ON user_personalization
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);