import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: cohorts } = await supabase.from('cohorts').select('id, name, current_slots');
  console.log("Cohorts:", cohorts);

  const { data: enrolls } = await supabase.from('academy_enrollments').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Latest Enrollments:", enrolls);
}
main();
