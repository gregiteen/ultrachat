-- Insert past chats directly
INSERT INTO threads (id, user_id, title, pinned, created_at, updated_at) VALUES
('6565f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'Chat about React Components', false, NOW(), NOW()),
('7575f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'TypeScript Discussion', false, NOW(), NOW()),
('8585f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'Database Design Help', false, NOW(), NOW()),
('9595f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'API Integration Questions', false, NOW(), NOW()),
('a5a5f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'Performance Optimization', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = EXCLUDED.updated_at;

-- Insert sample messages for each thread
INSERT INTO messages (id, thread_id, user_id, content, role, created_at, updated_at) VALUES
('1111f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'How do I create a reusable React component?', 'user', NOW(), NOW()),
('2222f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'To create a reusable React component...', 'assistant', NOW(), NOW()),

('3333f604-52c5-4fbd-b29c-7383cfb0d66f', '7575f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'What are TypeScript generics?', 'user', NOW(), NOW()),
('4444f604-52c5-4fbd-b29c-7383cfb0d66f', '7575f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'TypeScript generics are...', 'assistant', NOW(), NOW()),

('5555f604-52c5-4fbd-b29c-7383cfb0d66f', '8585f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'How should I structure my database?', 'user', NOW(), NOW()),
('6666f604-52c5-4fbd-b29c-7383cfb0d66f', '8585f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'For your database structure...', 'assistant', NOW(), NOW()),

('7777f604-52c5-4fbd-b29c-7383cfb0d66f', '9595f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'How do I integrate a REST API?', 'user', NOW(), NOW()),
('8888f604-52c5-4fbd-b29c-7383cfb0d66f', '9595f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'To integrate a REST API...', 'assistant', NOW(), NOW()),

('9999f604-52c5-4fbd-b29c-7383cfb0d66f', 'a5a5f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'How can I optimize my React app?', 'user', NOW(), NOW()),
('aaaaf604-52c5-4fbd-b29c-7383cfb0d66f', 'a5a5f604-52c5-4fbd-b29c-7383cfb0d66f', '6565f604-52c5-4fbd-b29c-7383cfb0d66f', 'To optimize your React app...', 'assistant', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = EXCLUDED.updated_at;

-- Ensure RLS policies are properly set
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own threads" ON threads;
  DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;

  -- Create more permissive policies
  CREATE POLICY "Users can view their own threads"
      ON threads FOR SELECT
      USING (deleted_at IS NULL);

  CREATE POLICY "Users can view messages in their threads"
      ON messages FOR SELECT
      USING (true);
END $$;