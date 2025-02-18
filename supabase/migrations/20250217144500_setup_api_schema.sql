-- Create API schema
CREATE SCHEMA IF NOT EXISTS api;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO postgres, authenticated;
GRANT USAGE ON SCHEMA api TO postgres, authenticated;

-- Create API functions schema
CREATE SCHEMA IF NOT EXISTS api_functions;
GRANT USAGE ON SCHEMA api_functions TO postgres, authenticated;

-- Enable PostgREST to use multiple schemas
ALTER DATABASE postgres SET search_path TO public, api, api_functions;

-- Create function to handle schema changes
CREATE OR REPLACE FUNCTION handle_schema_change()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh PostgREST schema cache
    NOTIFY pgrst, 'reload schema';
END;
$$;

-- Create event trigger for schema changes
DROP EVENT TRIGGER IF EXISTS schema_change_trigger;
CREATE EVENT TRIGGER schema_change_trigger
ON ddl_command_end
EXECUTE FUNCTION handle_schema_change();