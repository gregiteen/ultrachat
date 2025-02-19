-- Add voice and ai_name columns to contexts table
ALTER TABLE contexts 
ADD COLUMN IF NOT EXISTS voice jsonb DEFAULT '{
  "name": "Default Voice",
  "settings": {
    "stability": 0.75,
    "similarity_boost": 0.75
  }
}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_name text;

-- Update existing rows to set ai_name to name if it's null
UPDATE contexts 
SET ai_name = name 
WHERE ai_name IS NULL;

-- Add NOT NULL constraint to ai_name
ALTER TABLE contexts 
ALTER COLUMN ai_name SET NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contexts_user_id ON contexts(user_id);

-- Add default context for existing users who don't have any
INSERT INTO contexts (user_id, name, ai_name, content, is_active)
SELECT 
    id as user_id,
    'Default Assistant',
    'Default Assistant',
    'I am a helpful AI assistant.',
    true
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM contexts c WHERE c.user_id = u.id
);