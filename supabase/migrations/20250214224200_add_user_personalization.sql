-- Create user_personalization table
CREATE TABLE IF NOT EXISTS user_personalization (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  personal_info jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  has_seen_welcome boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Add RLS policies
ALTER TABLE user_personalization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personalization"
  ON user_personalization
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own personalization"
  ON user_personalization
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personalization"
  ON user_personalization
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to create personalization on user creation
CREATE OR REPLACE FUNCTION create_user_personalization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_personalization (
    user_id,
    personal_info,
    is_active,
    has_seen_welcome
  )
  VALUES (
    NEW.id,
    '{}'::jsonb,
    false,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create personalization on user creation
DROP TRIGGER IF EXISTS create_user_personalization_trigger ON auth.users;
CREATE TRIGGER create_user_personalization_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_personalization();