-- Drop existing thread policies
DROP POLICY IF EXISTS "Users can view their own threads" ON threads;
DROP POLICY IF EXISTS "Users can insert their own threads" ON threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON threads;
DROP POLICY IF EXISTS "Users can delete their own threads" ON threads;

-- Create improved thread policies
CREATE POLICY "Users can view their own threads"
    ON threads FOR SELECT
    USING (
        auth.uid() = user_id AND
        (deleted_at IS NULL OR deleted_at > now())
    );

CREATE POLICY "Users can insert their own threads"
    ON threads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
    ON threads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads"
    ON threads FOR DELETE
    USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_threads_user_id_deleted_at 
    ON threads(user_id, deleted_at) 
    WHERE deleted_at IS NULL;