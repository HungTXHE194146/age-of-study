require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function findActiveUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, last_active_at')
        .order('last_active_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Recent active profiles:');
    console.log(data);

    // Check factors for these
    for (const user of data) {
        const { data: factors, error: factorsError } = await supabase.auth.admin.mfa.listFactors({
            userId: user.id
        });
        if (factorsError) {
            console.error(`Error fetching factors for user ${user.id}:`, factorsError);
            continue;
        }
        console.log(`User ${user.id} (${user.full_name}, ${user.role}) factors: ${factors?.factors?.length || 0}`);
        if (factors?.factors?.length > 0) {
            console.log(JSON.stringify(factors.factors, null, 2));
        }
    }
}

findActiveUsers();
