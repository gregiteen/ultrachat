-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see their own settings." ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings." ON user_settings FOR UPDATE USING (auth.uid() = user_id);
-- No insert policy needed, handled by trigger

-- Function to create user settings on user creation
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id, settings)
  VALUES (NEW.id, '{}'::jsonb);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user settings on user creation in auth.users
CREATE TRIGGER create_user_settings_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings();