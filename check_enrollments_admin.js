import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('academy_enrollments').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Recent enrollments:");
  console.table(data);
  if (error) console.error("Error:", error);
}
check();
