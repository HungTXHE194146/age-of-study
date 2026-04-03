import { config } from 'dotenv';

console.log('START TEST');
config({ path: '.env.local' });
console.log('ENV LOADED');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'EXISTS' : 'MISSING');
console.log('KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING');
