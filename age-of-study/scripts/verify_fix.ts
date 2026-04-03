import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  const { data: subject } = await supabase.from('subjects').select('id').eq('code', 'TV5').single()
  const { data: nodes } = await supabase.from('nodes').select('id, title, week_number').eq('subject_id', subject.id).in('week_number', [27, 35])
  
  let output = 'VERIFICATION RESULTS:\n'
  nodes?.forEach(n => {
    output += `ID: ${n.id} | Week: ${n.week_number} | Title: ${n.title}\n`
  })
  
  fs.writeFileSync('verification_output.txt', output)
}

verify().catch(e => fs.writeFileSync('verification_output.txt', e.message))
