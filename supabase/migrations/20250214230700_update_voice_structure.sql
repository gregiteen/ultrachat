-- Update contexts table to use JSONB for voice field
ALTER TABLE contexts 
  ALTER COLUMN voice TYPE jsonb USING jsonb_build_object(
    'name', voice,
    'settings', jsonb_build_object(
      'stability', 0.75,
      'similarity_boost', 0.75
    )
  );

-- Add check constraint to ensure voice field has required structure
ALTER TABLE contexts
  ADD CONSTRAINT voice_structure_check
  CHECK (
    (voice ? 'name')
    AND (
      (voice->>'id' IS NULL)
      OR (
        (voice->>'id' IS NOT NULL)
        AND (voice ? 'settings')
        AND ((voice->'settings')::jsonb ? 'stability')
        AND ((voice->'settings')::jsonb ? 'similarity_boost')
      )
    )
  );

-- Update existing records to ensure they have the new structure
UPDATE contexts
SET voice = jsonb_build_object(
  'name', 
  CASE 
    WHEN voice IS NULL OR voice::text = '' 
    THEN 'default voice'
    ELSE voice::text
  END,
  'settings', jsonb_build_object(
    'stability', 0.75,
    'similarity_boost', 0.75
  )
)
WHERE voice IS NULL OR voice::text = '' OR (voice::jsonb->>'settings') IS NULL;

-- Add comment to explain the voice field structure
COMMENT ON COLUMN contexts.voice IS 'Voice configuration in JSON format. Structure: {
  "id": "optional-elevenlabs-voice-id",
  "name": "required-voice-name",
  "description": "optional-voice-description",
  "settings": {
    "stability": number-between-0-and-1,
    "similarity_boost": number-between-0-and-1
  }
}';