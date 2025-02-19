-- Remove old metadata column and add new integrations column
ALTER TABLE messages
DROP COLUMN IF EXISTS metadata,
ADD COLUMN IF NOT EXISTS integrations JSONB;

-- Add index for integrations lookup
CREATE INDEX IF NOT EXISTS idx_messages_integrations ON messages USING gin(integrations);

-- Comment on column
COMMENT ON COLUMN messages.integrations IS 'Tracks which integrations were used to generate this message. Format: { used: string[], context: Record<string, any> }';