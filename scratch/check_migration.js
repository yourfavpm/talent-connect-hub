import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Checking RLS policies for academy_enrollments in pg_policies...");
  // pg_policies is a system view, we can check it
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'academy_enrollments');

  if (error) {
    console.error("Error querying pg_policies directly. Let's try executing RPC if it exists or other tables.");
    console.error(error);
  } else {
    console.log("Found RLS policies:");
    data.forEach(p => {
      console.log(`- Policy Name: "${p.policyname}", Cmd: ${p.cmd}, Roles: ${p.roles}, Qual: "${p.qual}", WithCheck: "${p.with_check}"`);
    });
  }
}
check();
