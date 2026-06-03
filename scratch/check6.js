import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: v1, error: e1 } = await supabase.from('talent_profiles').select('status');
  const countsV1 = (v1 || []).reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  console.log('talent_profiles status count:', countsV1);

  const { data: v2, error: e2 } = await supabase.from('v2_talent_profiles').select('status');
  const countsV2 = (v2 || []).reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  console.log('v2_talent_profiles status count:', countsV2);
}
run();
