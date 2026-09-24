import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

console.log("Supabase URL:", process.env.SUPABASE_URL);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    const { data, error } = await supabase.from('user').select('*').limit(1);
    if (error) {
      console.error("Supabase REST API failed:", error);
    } else {
      console.log("Supabase REST API connection successful! First user:", data);
    }
  } catch (err) {
    console.error("Supabase REST API threw error:", err);
  }
}

main();
