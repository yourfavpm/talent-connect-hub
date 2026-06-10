import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

config();

async function run() {
  const psql = `npx -y supabase db query "ALTER TYPE compensation_type ADD VALUE IF NOT EXISTS 'annual';" --db-url "${process.env.SUPABASE_URL.replace('https://', 'postgresql://postgres:limitlessopslyhr@db.')}:5432/postgres"`;
  try {
    const res = execSync(psql, { stdio: 'inherit' });
    console.log("Success");
  } catch (err) {
    console.error("Failed", err);
  }
}
run();
