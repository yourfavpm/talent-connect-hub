import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkEnrollments() {
  const { data, error } = await supabase
    .from('academy_enrollments')
    .select('*, cohorts(name, id), academy_courses(title)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Recent Enrollments:", JSON.stringify(data, null, 2));
}

checkEnrollments();
