import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pahtzlskmauifledecwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaHR6bHNrbWF1aWZsZWRlY3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMzAwMTIsImV4cCI6MjA1NDkwNjAxMn0.fiOy_Ekc_2WowpFKNz5eB79Zra6iUHQxMaqoreq0nXc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    // First try to query threads table to see if it exists
    const { error: queryError } = await supabase
      .from('threads')
      .select('id')
      .limit(1);

    // If table doesn't exist, create it
    if (queryError?.code === '42P01') {
      console.log('Creating threads table...');
      
      // We need to use the service_role key to create tables
      console.error('Please create the tables using the Supabase dashboard or CLI.');
      console.error('Required tables:');
      console.error(`
1. threads table:
   - id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
   - user_id: uuid REFERENCES auth.users NOT NULL
   - title: text NOT NULL
   - pinned: boolean DEFAULT false
   - created_at: timestamptz DEFAULT now()
   - updated_at: timestamptz DEFAULT now()
   - deleted_at: timestamptz DEFAULT NULL

2. Add to messages table:
   - thread_id: uuid REFERENCES threads

3. Required policies:
   - "Users can CRUD their own threads" ON threads
     FOR ALL TO authenticated
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id)

4. Required indexes:
   - idx_threads_user_id ON threads(user_id)
   - idx_threads_pinned ON threads(pinned) WHERE pinned = true
   - idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NOT NULL
   - idx_messages_thread_id ON messages(thread_id)

5. Required functions:
   - ensure_tables() function to create tables if they don't exist
   - update_threads_updated_at trigger on threads table
      `);
      
      process.exit(1);
    }

    console.log('Tables already exist');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();