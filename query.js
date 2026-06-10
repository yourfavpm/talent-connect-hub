import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, user_id, email, heard_from').order('created_at', { ascending: false }).limit(15);
  console.log("Recent Profiles:", data);
}
run();
