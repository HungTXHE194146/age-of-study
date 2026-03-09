import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: classes } = await supabase.from("classes").select("name");
  console.log("CLASSES:", classes);
  
  const { data: profiles } = await supabase.from("profiles").select("full_name").eq("role", "teacher").limit(5);
  console.log("TEACHERS:", profiles);
}

check();
