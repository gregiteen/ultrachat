-- Function to ensure contexts table exists and has correct schema
CREATE OR REPLACE FUNCTION ensure_contexts_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner
SET search_path = public -- Set proper search path
AS $$
BEGIN
  -- Create contexts table if it doesn't exist
  CREATE TABLE IF NOT EXISTS contexts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    name text NOT NULL,
    ai_name text NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT false,
    voice jsonb DEFAULT '{
      "name": "Default Voice",
      "settings": {
        "stability": 0.75,
        "similarity_boost": 0.75
      }
    }'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Add RLS if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contexts'
  ) THEN
    ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can CRUD their own contexts"
      ON contexts
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Add index if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'contexts' AND indexname = 'idx_contexts_user_id'
  ) THEN
    CREATE INDEX idx_contexts_user_id ON contexts(user_id);
  END IF;

  -- Add updated_at trigger if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contexts_updated_at'
  ) THEN
    CREATE TRIGGER update_contexts_updated_at
      BEFORE UPDATE ON contexts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_contexts_table() TO authenticated;

-- Create the table initially
SELECT ensure_contexts_table();