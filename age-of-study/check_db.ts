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
  const { data: classes, error: classesError } = await supabase.from("classes").select("name");
  if (classesError) {
    console.error("Error fetching classes:", classesError.message);
  }
  console.log("CLASSES:", classes);
  
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("full_name").eq("role", "teacher").limit(5);
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError.message);
  }
  console.log("TEACHERS:", profiles);
}

check().catch((err) => {
  console.error("Check failed:", err);
  process.exit(1);
});
