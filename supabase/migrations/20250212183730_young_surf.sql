/*
  # Fix subscription and API usage tables

  1. Changes
    - Add complete RLS policies for subscriptions table
    - Add complete RLS policies for api_usage table
    - Ensure safe policy creation with IF NOT EXISTS checks

  2. Security
    - Enable RLS on both tables
    - Add policies for all CRUD operations
    - Ensure users can only access their own data
*/

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  tier text NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  customer_id text,
  subscription_id text,
  payment_method jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create api_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_requests integer DEFAULT 0,
  requests_by_type jsonb DEFAULT '{
    "chat": 0,
    "task": 0,
    "email": 0,
    "calendar": 0
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
  DROP POLICY IF EXISTS "Users can insert their own subscription" ON subscriptions;
  DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;
  DROP POLICY IF EXISTS "Users can delete their own subscription" ON subscriptions;
  DROP POLICY IF EXISTS "Users can view their own API usage" ON api_usage;
  DROP POLICY IF EXISTS "Users can insert their own API usage" ON api_usage;
  DROP POLICY IF EXISTS "Users can update their own API usage" ON api_usage;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create subscription policies
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscription"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create API usage policies
CREATE POLICY "Users can view their own API usage"
  ON api_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API usage"
  ON api_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API usage"
  ON api_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_api_usage_updated_at
    BEFORE UPDATE ON api_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_user_id uuid,
  p_request_type text,
  p_count integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_period api_usage%ROWTYPE;
BEGIN
  -- Get or create current period
  SELECT * INTO current_period
  FROM api_usage
  WHERE user_id = p_user_id
    AND period_start <= now()
    AND period_end >= now();

  IF NOT FOUND THEN
    -- Create new period
    INSERT INTO api_usage (
      user_id,
      period_start,
      period_end,
      total_requests,
      requests_by_type
    ) VALUES (
      p_user_id,
      date_trunc('month', now()),
      (date_trunc('month', now()) + interval '1 month' - interval '1 second'),
      p_count,
      jsonb_build_object(
        'chat', CASE WHEN p_request_type = 'chat' THEN p_count ELSE 0 END,
        'task', CASE WHEN p_request_type = 'task' THEN p_count ELSE 0 END,
        'email', CASE WHEN p_request_type = 'email' THEN p_count ELSE 0 END,
        'calendar', CASE WHEN p_request_type = 'calendar' THEN p_count ELSE 0 END
      )
    );
  ELSE
    -- Update existing period
    UPDATE api_usage
    SET
      total_requests = total_requests + p_count,
      requests_by_type = jsonb_set(
        requests_by_type,
        array[p_request_type],
        to_jsonb(COALESCE((requests_by_type->>p_request_type)::integer, 0) + p_count)
      ),
      updated_at = now()
    WHERE id = current_period.id;
  END IF;
END;
$$;

-- Add helpful comments
COMMENT ON TABLE subscriptions IS 'Stores user subscription details including plan type and billing info';
COMMENT ON TABLE api_usage IS 'Tracks API usage per user with request counts by type';
COMMENT ON FUNCTION increment_api_usage IS 'Increments API usage counters for a user, creating new period if needed';