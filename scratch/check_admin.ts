import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkAdmin() {
  const email = 'benita.dva@gmail.com'; // User's email from recent enrollment
  
  // Get user ID
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === email);
  
  if (!user) {
    console.log("User not found");
    return;
  }

  console.log("User ID:", user.id);

  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id);

  console.log("Roles for " + email + ":", roles);
}

checkAdmin();
