import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pahtzlskmauifledecwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaHR6bHNrbWF1aWZsZWRlY3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMzAwMTIsImV4cCI6MjA1NDkwNjAxMn0.fiOy_Ekc_2WowpFKNz5eB79Zra6iUHQxMaqoreq0nXc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkThreads() {
  console.log('Checking threads table...');

  // Get all threads
  const { data: allThreads, error: allError } = await supabase
    .from('threads')
    .select('*');

  console.log('\nAll threads:', allThreads?.length || 0);
  console.log('Error:', allError);

  if (allThreads) {
    console.log('\nThread details:');
    allThreads.forEach(thread => {
      console.log(`\nID: ${thread.id}`);
      console.log(`Title: ${thread.title}`);
      console.log(`User ID: ${thread.user_id}`);
      console.log(`Created: ${thread.created_at}`);
      console.log(`Deleted: ${thread.deleted_at}`);
    });
  }

  // Check RLS policies
  const { data: policies, error: policyError } = await supabase
    .rpc('get_policies', { table_name: 'threads' });

  console.log('\nRLS Policies:', policies);
  console.log('Policy Error:', policyError);

  process.exit(0);
}

checkThreads().catch(console.error);