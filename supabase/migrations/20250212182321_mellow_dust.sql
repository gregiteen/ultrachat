/*
  # Setup Integration System

  1. New Tables
    - `integrations`
      - Stores user integration connections and credentials
    - `integration_logs`
      - Tracks integration activity and sync history
    
  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    
  3. Functions
    - Add helper functions for token refresh and validation
*/

-- Create integrations table
CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL CHECK (type IN ('gmail', 'outlook', 'slack', 'google_calendar', 'zoom', 'teams')),
  status text NOT NULL CHECK (status IN ('connected', 'disconnected', 'error')),
  credentials jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  last_synced timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create integration_logs table
CREATE TABLE integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES integrations ON DELETE CASCADE,
  event_type text NOT NULL,
  status text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own integrations"
  ON integrations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their integration logs"
  ON integration_logs
  FOR SELECT
  TO authenticated
  USING (
    integration_id IN (
      SELECT id FROM integrations WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger for integrations
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to refresh OAuth tokens
CREATE OR REPLACE FUNCTION refresh_oauth_token(integration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  integration_record integrations;
  new_tokens jsonb;
BEGIN
  -- Get the integration record
  SELECT * INTO integration_record
  FROM integrations
  WHERE id = integration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Integration not found';
  END IF;

  -- TODO: Implement token refresh logic for each provider
  -- This is a placeholder that would be replaced with actual OAuth refresh logic
  new_tokens = jsonb_build_object(
    'access_token', 'new_token',
    'refresh_token', integration_record.credentials->>'refresh_token',
    'expires_at', (extract(epoch from now()) + 3600)::text
  );

  -- Update the integration record
  UPDATE integrations
  SET 
    credentials = new_tokens,
    updated_at = now()
  WHERE id = integration_id;

  -- Log the refresh
  INSERT INTO integration_logs (
    integration_id,
    event_type,
    status,
    details
  ) VALUES (
    integration_id,
    'token_refresh',
    'success',
    jsonb_build_object('timestamp', now())
  );

  RETURN new_tokens;
EXCEPTION WHEN OTHERS THEN
  -- Log the error
  INSERT INTO integration_logs (
    integration_id,
    event_type,
    status,
    details
  ) VALUES (
    integration_id,
    'token_refresh',
    'error',
    jsonb_build_object(
      'error', SQLERRM,
      'timestamp', now()
    )
  );
  
  RAISE;
END;
$$;