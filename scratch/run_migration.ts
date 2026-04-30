import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function runMigration() {
  const sql = `
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE constraint_name = 'fk_enrollment_profile_user') THEN
            ALTER TABLE public.academy_enrollments 
            ADD CONSTRAINT fk_enrollment_profile_user 
            FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
        END IF;
    END $$;

    UPDATE public.academy_enrollments ae
    SET 
        student_name = COALESCE(ae.student_name, p.first_name || ' ' || p.last_name, 'Student'),
        student_email = COALESCE(ae.student_email, p.email)
    FROM public.profiles p
    WHERE ae.user_id = p.user_id
    AND (ae.student_name IS NULL OR ae.student_email IS NULL);
  `;

  // Supabase RPC doesn't support raw SQL easily unless you have a dedicated function.
  // But wait! I can't run raw SQL from the client even with service role.
  
  console.log("Please run the following SQL in your Supabase SQL Editor:");
  console.log(sql);
}

runMigration();
