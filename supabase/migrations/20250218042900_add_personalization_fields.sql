/*
  # Add additional personalization fields
  
  1. Changes
    - Add health_info JSONB column
    - Add relationships JSONB column
    - Add identity_info JSONB column
    - Add notes TEXT column
    - Add additional_info JSONB column for future extensibility
*/

ALTER TABLE user_personalization
ADD COLUMN IF NOT EXISTS health_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS relationships JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS identity_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS additional_info JSONB DEFAULT '{}'::jsonb;

-- Add comments
COMMENT ON COLUMN user_personalization.health_info IS 'Health-related information and preferences';
COMMENT ON COLUMN user_personalization.relationships IS 'Information about personal and professional relationships';
COMMENT ON COLUMN user_personalization.identity_info IS 'Personal identity and worldview information';
COMMENT ON COLUMN user_personalization.notes IS 'Additional notes and comments';
COMMENT ON COLUMN user_personalization.additional_info IS 'Extensible field for future personalization data';