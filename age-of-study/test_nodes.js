require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase
        .from('nodes')
        .select('id, title, parent_node_id, order_index, volume_number')
        .eq('volume_number', 2)
        .order('order_index')
        .limit(20);

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

run();
