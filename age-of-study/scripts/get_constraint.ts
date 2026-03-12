import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'check_question_logic'" });
  if (error) {
    // try to just select directly if rpc doesn't work. We might not have execute_sql rpc.
    console.error("RPC failed:", error.message);
  } else {
    console.log(data);
  }
}
main();
