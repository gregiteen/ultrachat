-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in their threads" ON messages;

-- Create improved message policies
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

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Fix order parameter handling
CREATE OR REPLACE FUNCTION fix_order_param() RETURNS void AS $$
BEGIN
    -- Add order column if needed
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'threads' 
        AND column_name = 'order'
    ) THEN
        ALTER TABLE threads ADD COLUMN "order" BIGINT;
        
        -- Initialize order for existing threads
        WITH ordered_threads AS (
            SELECT id, ROW_NUMBER() OVER (
                PARTITION BY user_id 
                ORDER BY 
                    CASE WHEN pinned THEN 1 ELSE 2 END,
                    updated_at DESC
            ) as row_num
            FROM threads
        )
        UPDATE threads t
        SET "order" = ot.row_num
        FROM ordered_threads ot
        WHERE t.id = ot.id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT fix_order_param();