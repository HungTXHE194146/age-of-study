import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkEmails() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  let needsFix = 0;
  for (const user of users.users) {
    if (user.user_metadata?.role === 'student' && user.user_metadata?.username) {
      const username = user.user_metadata.username.toLowerCase().trim();
      const expectedEmail = `${username}@ageofstudy.local`;
      
      if (user.email !== expectedEmail) {
        console.log(`Student: ${username}, Current Email: ${user.email}`);
        console.log(`  --> Needs fix! (Expected: ${expectedEmail})`);
        needsFix++;
        
        // Fix it
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { email: expectedEmail });
        if (updateError) {
          console.error(`  --> Fix failed:`, updateError);
        } else {
           console.log(`  --> Fixed!`);
        }
      }
    }
  }

  console.log(`\nFound and fixed ${needsFix} students needing email domain fix.`);
}

checkEmails();
