-- Create message_versions table
CREATE TABLE IF NOT EXISTS message_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ensure version numbers are unique per message
  UNIQUE(message_id, version_number)
);

-- Add version_count to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS version_count INTEGER NOT NULL DEFAULT 1;

-- Create function to handle version creation
CREATE OR REPLACE FUNCTION handle_message_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If content changed, create new version
  IF TG_OP = 'UPDATE' AND OLD.content <> NEW.content THEN
    -- Increment version count
    NEW.version_count := OLD.version_count + 1;
    
    -- Insert new version
    INSERT INTO message_versions (
      message_id,
      content,
      version_number,
      created_by
    ) VALUES (
      NEW.id,
      NEW.content,
      NEW.version_count,
      NEW.user_id
    );
  END IF;
  
  -- For new messages, create initial version
  IF TG_OP = 'INSERT' THEN
    INSERT INTO message_versions (
      message_id,
      content,
      version_number,
      created_by
    ) VALUES (
      NEW.id,
      NEW.content,
      1,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version handling
DROP TRIGGER IF EXISTS message_version_trigger ON messages;
CREATE TRIGGER message_version_trigger
  AFTER INSERT OR UPDATE OF content
  ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_version();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_message_versions_message_id ON message_versions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_versions_version ON message_versions(message_id, version_number);