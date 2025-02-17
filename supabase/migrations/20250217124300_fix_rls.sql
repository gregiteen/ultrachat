-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own threads" ON threads;
DROP POLICY IF EXISTS "Users can insert their own threads" ON threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON threads;
DROP POLICY IF EXISTS "Users can delete their own threads" ON threads;

DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in their threads" ON messages;

-- Thread policies
CREATE POLICY "Users can view their own threads"
    ON threads FOR SELECT
    USING (auth.uid() = user_id);

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

-- Message policies
CREATE POLICY "Users can view messages in their threads"
    ON messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages in their threads"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete messages in their threads"
    ON messages FOR DELETE
    USING (auth.uid() = user_id);