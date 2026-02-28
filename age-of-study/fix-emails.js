const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmails() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  let needsFix = 0;
  for (const user of users.users) {
    if (user.user_metadata?.role === 'student') {
      console.log(`Student: ${user.user_metadata.username}, Email: ${user.email}`);
      
      const expectedEmail = `${user.user_metadata.username}@aos.local`.toLowerCase();
      if (user.email !== expectedEmail) {
        console.log(`  --> Needs fix! (Expected: ${expectedEmail})`);
        needsFix++;
        
        // Fix it
        await supabase.auth.admin.updateUserById(user.id, { email: expectedEmail });
        console.log(`  --> Fixed!`);
      }
    }
  }

  console.log(`\nFound ${needsFix} students needing email domain fix.`);
}

checkEmails();
