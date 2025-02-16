-- Add personalization_document column
ALTER TABLE user_personalization
ADD COLUMN IF NOT EXISTS personalization_document JSONB;

-- Update existing rows with empty document
UPDATE user_personalization
SET personalization_document = '{}'::jsonb
WHERE personalization_document IS NULL;