import { supabase } from './supabase';

export async function verifyDatabaseStructure() {
  console.log('Verifying database structure...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    const requiredTables = [
      'threads',
      'messages',
      'user_personalization',
      'contexts'
    ];

    const optionalTables = [
      'custom_themes'
    ];

    // Try to access each required table
    for (const table of requiredTables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is ok
        if (error.code === '42P01') { // Table doesn't exist
          console.error(`Table ${table} does not exist:`, error);
          return false;
        }
        if (table === 'user_personalization') {
          // Create user personalization record if it doesn't exist
          const { error: createError } = await supabase
            .from('user_personalization')
            .insert({ user_id: user.id })
            .select('id')
            .single();
          
          if (createError && createError.code !== 'PGRST116') {
            console.error(`Error creating user_personalization:`, createError);
            return false;
          }
        } else {
          console.error(`Error accessing ${table}:`, error);
          return false;
        }
      }
    }

    // Check optional tables but don't fail if they don't exist
    for (const table of optionalTables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        if (error.code === '42P01') {
          console.warn(`Optional table ${table} not found - this is normal during setup`);
        } else {
          console.warn(`Optional table ${table} not accessible:`, error);
        }
      }
    }
    
    console.log('All required tables are accessible');

    // Check if user has access
    const { error: threadsError } = await supabase
      .from('threads')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (threadsError && threadsError.code !== 'PGRST116') {
      console.error('Error checking thread access:', threadsError);
      return false;
    }

    const { error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (messagesError && messagesError.code !== 'PGRST116') {
      console.error('Error checking message access:', messagesError);
      return false;
    }

    console.log('Database structure verified successfully');
    return true;
  } catch (error) {
    console.error('Error verifying database structure:', error);
    return false;
  }
}