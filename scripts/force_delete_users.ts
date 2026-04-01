import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use the service role key to bypass RLS and have deletion permissions
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('--- Warning: This script will force delete ALL talent and client users ---');
  console.log('Connecting to Subabase admin client...\n');

  try {
    // We only want to delete users whose role is 'talent' or 'client'.
    // Administrators / Staff should be kept intact.
    const { data: usersData, error: usersError } = await supabaseAdmin.from('users').select('id, email, user_type').in('user_type', ['talent', 'client']);

    if (usersError) throw usersError;

    if (!usersData || usersData.length === 0) {
      console.log('No talent or client users found in the users table.');
      return;
    }

    console.log(`Found ${usersData.length} talent and client users to delete.\n`);

    let successCount = 0;
    let failCount = 0;

    for (const user of usersData) {
      process.stdout.write(`Deleting user: ${user.email} (ID: ${user.id})... `);
      
      // We use auth.admin.deleteUser which removes the user from auth.users.
      // Assuming ON DELETE CASCADE is set up on public.users, this will also cascade to public tables.
      // (If not, we might need a more complex deletion script handling foreign keys like in 20260120000000_fix_user_deletion_constraints.sql)
      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

      if (error) {
         console.log(`❌ Failed: ${error.message}`);
         failCount++;
      } else {
         console.log('✅ Success');
         successCount++;
      }
    }

    console.log('\n--- Deletion Summary ---');
    console.log(`Successfully deleted: ${successCount}`);
    console.log(`Failed to delete: ${failCount}`);
    
    if (failCount > 0) {
        console.log('\nNote: If users failed to delete, it usually means there is a strict foreign key constraint missing ON DELETE CASCADE or ON DELETE SET NULL on a table referencing auth.users.');
    }

  } catch (err: any) {
    console.error('An unexpected error occurred:', err.message);
  }
}

main().catch(console.error);
