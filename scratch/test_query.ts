import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testFrontendQuery() {
  const cohortId = '638ad44e-5abb-42e8-ae90-a1f11de501f6'; // The one with recent enrollment
  
  const { data, error } = await supabase
    .from("academy_enrollments")
    .select("*, profiles:user_id(streak_count, total_study_hours)")
    .eq("cohort_id", cohortId);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Found Enrollments:", data?.length);
  console.log("Enrollments:", JSON.stringify(data, null, 2));
}

testFrontendQuery();
