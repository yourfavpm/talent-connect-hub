require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function purgeUsers() {
  console.log("Fetching client and talent users...");
  const { data: users, error: fetchError } = await supabase.from('users').select('id, email, user_type').in('user_type', ['client', 'talent']);
  
  if (fetchError) {
    console.error("Error fetching users", fetchError);
    return;
  }

  if (!users || users.length === 0) {
    console.log("No talent or client users found.");
    return;
  }

  console.log(`Found ${users.length} users to delete.`);
  for (const user of users) {
    console.log(`Attempting to delete ${user.email} (ID: ${user.id})...`);
    // Delete from auth.users (cascades to public.users if configured correctly)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`❌ Failed to delete ${user.email}:`, deleteError.message);
    } else {
      console.log(`✅ Deleted ${user.email}`);
    }
  }
}

purgeUsers();
