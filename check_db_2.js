import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { count: enrollCount, error: enrollErr } = await supabase.from('academy_enrollments').select('*', { count: 'exact', head: true });
  console.log("Academy Enrollments count:", enrollCount, enrollErr || '');

  const { count: txnCount, error: txnErr } = await supabase.from('course_transactions').select('*', { count: 'exact', head: true });
  console.log("Course Transactions count:", txnCount, txnErr || '');

  const { data: cohorts, error: cohortsErr } = await supabase.from('cohorts').select('id, name, current_slots');
  console.log("Cohorts:", cohorts, cohortsErr || '');

  // Let's get the transactions to see who paid
  const { data: txns } = await supabase.from('course_transactions').select('*');
  console.log("Transactions:", txns);
}

main();
