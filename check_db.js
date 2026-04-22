import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: user } = await supabase.auth.admin.listUsers();
  const userId = user?.users?.[0]?.id || "e3b0c442-989b-464b-8000-000000000000";

  console.log("Trying insert with user:", userId);
  
  const { error } = await supabase.from('academy_enrollments').insert({
    user_id: userId,
    course_id: "test-slug",
    cohort_id: null,
    course_name: "Test Course",
    student_email: "test@example.com",
    student_name: "Test",
    enrollment_status: "active",
    price_naira: 1000,
    price_usd: 10,
    enrollment_date: new Date().toISOString(),
    access_granted_at: new Date().toISOString()
  });
  
  console.log("Insert result error:", error);
}
check();
