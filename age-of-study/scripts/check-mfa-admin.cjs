require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(email) {
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

    const { data: mfaData, error: mfaError } = await supabase.auth.admin.mfa.listFactors({
        userId: user.id
    });

    if (mfaError) {
        console.error('Error fetching factors:', mfaError.message);
    } else {
        console.log('Factors from admin API:');
        console.log(JSON.stringify(mfaData, null, 2));
    }
}

const email = process.argv[2] || '';
checkUser(email);
