import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
     // fallback if RPC doesn't exist
     const { data: qdata, error: qerr } = await supabase.from('pg_policies').select('*').eq('tablename', 'academy_enrollments');
     console.log("pg_policies query error:", qerr);
  } else {
     console.log(data);
  }
}
check();
