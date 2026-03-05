import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(email: string) {
  console.log('Fetching user with email:', email);
  
  // Get all users (for small DBs) or find by email
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }
  
  if (!email) {
    console.log('All Users:');
    users.users.forEach(u => console.log(`- ${u.id} | ${u.email}`));
    return;
  }
  
  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log(`Found user: ${user.id} - ${user.email}`);
  console.log(`factors list from admin auth...`);
  
  const { data: mfaData, error: mfaError } = await supabase.auth.admin.mfa.listFactors({
    userId: user.id
  });
  
  if (mfaError) {
    console.error('Error fetching factors:', mfaError.message);
  } else {
    console.log('Factors from admin API:');
checkUser(email).catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
  }
}

// Get email from args
const email = process.argv[2] || '';
checkUser(email);
