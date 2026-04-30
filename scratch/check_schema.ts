import { createClient } from '@supabase/supabase-client-helpers';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data: sessions, error: sErr } = await supabase.from('sessions').select('*').limit(1);
  console.log('Sessions Columns:', sessions ? Object.keys(sessions[0] || {}) : 'No data');
  if (sErr) console.error('Sessions Error:', sErr);

  const { data: announcements, error: aErr } = await supabase.from('announcements').select('*').limit(1);
  console.log('Announcements Columns:', announcements ? Object.keys(announcements[0] || {}) : 'No data');
  if (aErr) console.error('Announcements Error:', aErr);

  const { data: assignments, error: asErr } = await supabase.from('assignments').select('*').limit(1);
  console.log('Assignments Columns:', assignments ? Object.keys(assignments[0] || {}) : 'No data');
  if (asErr) console.error('Assignments Error:', asErr);
}

checkSchema();
