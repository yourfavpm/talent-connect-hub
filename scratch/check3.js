import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('talents').select('is_vetted, profile_status');
  if (error) console.error(error);
  
  const vettingCounts = (data || []).reduce((acc, row) => {
    const status = row.is_vetted ? 'vetted' : 'not_vetted';
    acc[status] = (acc[status] || 0) + 1;
    acc[row.profile_status] = (acc[row.profile_status] || 0) + 1;
    return acc;
  }, {});
  console.log('talents counts:', vettingCounts);
}
run();
