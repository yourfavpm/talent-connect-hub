import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: enrolls } = await supabase.from('academy_enrollments').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Latest Enrollments:", enrolls);
}
main();
