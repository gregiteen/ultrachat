-- Add voice field to contexts table
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS voice jsonb DEFAULT '{
  "name": "Default Voice",
  "settings": {
    "stability": 0.75,
    "similarity_boost": 0.75
  }
}'::jsonb;

-- Add ai_name field to contexts table
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS ai_name text;