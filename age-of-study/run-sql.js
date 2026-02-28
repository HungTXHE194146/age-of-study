import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase service role key missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data, error } = await supabase.rpc('get_policies_debug');
  if (error) {
    console.error("RPC error, falling back to direct query using REST API...", error.message);
    const { data: dbData, error: dbError } = await supabase
      .from('pg_policies')
      .select('*')
      .limit(100);
      
    if (dbError) {
      console.log('Error fetching policies:', dbError);
    } else {
      console.log(JSON.stringify(dbData, null, 2));
    }
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
