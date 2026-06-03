import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({path: '.env.local'});
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const sql = fs.readFileSync('supabase/migrations/20260603130000_admin_reschedule_interview.sql', 'utf8');

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.log("exec_sql not found, let's try rest API or just psql");
    console.error(error);
  } else {
    console.log("Success", data);
  }
}
run();
