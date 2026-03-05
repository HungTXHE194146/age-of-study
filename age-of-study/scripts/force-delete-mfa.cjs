require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function fixUser() {
    const userId = 'fa43acc1-7785-4821-b0d1-778618b12f9c'; // Nguyễn Phi Phii
    const { data: factors, error: listError } = await supabase.auth.admin.mfa.listFactors({
        userId
    });

    if (listError) {
        console.error('Failed to list MFA factors:', listError);
        process.exit(1);
    }

    if (factors && factors.factors && factors.factors.length > 0) {
        console.log(`Found ${factors.factors.length} factors for user ${userId}. Deleting...`);
        for (const factor of factors.factors) {
            const { error } = await supabase.auth.admin.mfa.deleteFactor({
                id: factor.id,
                userId: userId
            });
            if (error) {
                console.error(`Failed to delete factor ${factor.id}:`, error);
            } else {
                console.log(`Successfully deleted factor ${factor.id}`);
            }
            // Also ensure DB is clean
            const { error: updateError } = await supabase.from('profiles').update({ mfa_enabled: false }).eq('id', userId);
            if (updateError) {
                console.error('Failed to update profiles table:', updateError);
            } else {
                console.log('DB profiles synced to mfa_enabled: false');
            }
        }

        // Also ensure DB is clean
        await supabase.from('profiles').update({ mfa_enabled: false }).eq('id', userId);
        console.log('DB profiles synced to mfa_enabled: false');
    }

    fixUser();
