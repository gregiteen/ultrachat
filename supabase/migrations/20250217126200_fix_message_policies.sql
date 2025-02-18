-- Drop existing message policies
DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in their threads" ON messages;

-- Create more permissive message policies
CREATE POLICY "Users can view messages in their threads"
    ON messages FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT user_id FROM threads WHERE id = messages.thread_id
        )
    );

CREATE POLICY "Users can insert messages in their threads"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        auth.uid() IN (
            SELECT user_id FROM threads WHERE id = thread_id
        )
    );

CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete messages in their threads"
    ON messages FOR DELETE
    USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT user_id FROM threads WHERE id = messages.thread_id
        )
    );

-- Analyze tables for better query planning
ANALYZE messages;
ANALYZE threads;