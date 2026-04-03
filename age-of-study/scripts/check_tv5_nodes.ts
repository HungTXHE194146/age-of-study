import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('Connecting to:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkNodes() {
  console.log('Fetching subject TV5...')
  const { data: subject, error: subError } = await supabase
    .from('subjects')
    .select('id')
    .eq('code', 'TV5')
    .single()

  if (subError || !subject) {
    console.error('TV5 subject not found:', subError)
    return
  }

  console.log('Found TV5 ID:', subject.id)

  console.log('Fetching nodes...')
  const { data: nodes, error } = await supabase
    .from('nodes')
    .select('id, title, week_number, volume_number')
    .eq('subject_id', subject.id)
    .order('week_number', { ascending: true })

  if (error) {
    console.error('Error fetching nodes:', error)
    return
  }

  console.log(`Found ${nodes?.length} nodes.`)
  
  const suspicious = nodes?.filter(n => n.title.includes('Ôn tập') || n.title.includes('Đánh giá'))
  console.log('\n--- SUSPICIOUS NODES (Review/Assessment) ---')
  suspicious?.forEach(n => {
    console.log(`ID: ${n.id} | Week: ${n.week_number} | Vol: ${n.volume_number} | Title: ${n.title}`)
  })

  const w27 = nodes?.filter(n => n.week_number === 27)
  console.log('\n--- WEEK 27 NODES ---')
  w27?.forEach(n => console.log(`ID: ${n.id} | Title: ${n.title}`))

  const w35 = nodes?.filter(n => n.week_number === 35)
  console.log('\n--- WEEK 35 NODES ---')
  if (w35 && w35.length > 0) {
    w35.forEach(n => console.log(`ID: ${n.id} | Title: ${n.title}`))
  } else {
    console.log('NO NODES FOUND FOR WEEK 35!')
  }
}

checkNodes().catch(console.error)
