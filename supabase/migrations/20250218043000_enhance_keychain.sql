-- Enhance keychain table with new security features
ALTER TABLE keychain
ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS salt integer[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Create audit log table
CREATE TABLE IF NOT EXISTS keychain_audit_log (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    action text NOT NULL,
    severity text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    key_id uuid REFERENCES keychain(id),
    service text,
    metadata jsonb,
    ip_address text,
    user_agent text,
    timestamp timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_keychain_user_service ON keychain(user_id, service);
CREATE INDEX IF NOT EXISTS idx_keychain_audit_user ON keychain_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_keychain_audit_timestamp ON keychain_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_keychain_audit_action ON keychain_audit_log(action);

-- Add RLS policies for audit log
ALTER TABLE keychain_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON keychain_audit_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
ON keychain_audit_log
FOR INSERT
WITH CHECK (true);

-- Update existing keys to have salt
UPDATE keychain
SET salt = ARRAY(
    SELECT floor(random() * 256)::integer
    FROM generate_series(1, 16)
)
WHERE salt = '{}';

-- Add metadata for existing keys
UPDATE keychain
SET metadata = jsonb_build_object(
    'created_at', created_at,
    'last_accessed', now(),
    'usage_count', 0
)
WHERE metadata IS NULL;

-- Add comments for documentation
COMMENT ON TABLE keychain_audit_log IS 'Audit log for keychain operations';
COMMENT ON COLUMN keychain.version IS 'Encryption version for key rotation';
COMMENT ON COLUMN keychain.salt IS 'Salt used for key derivation';
COMMENT ON COLUMN keychain.metadata IS 'Additional metadata like usage stats';