import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("v2_talent_profiles")
    .select("id")
    .limit(1);

  if (data && data.length > 0) {
    const tpId = data[0].id;
    console.log("Found profile", tpId);
    // Just testing if the column accepts updates
    const { error: updateError } = await supabase
      .from("v2_talent_profiles")
      .update({ is_suspended: false })
      .eq("id", tpId);
    console.log("Update Error:", updateError);
  }
}
run();
