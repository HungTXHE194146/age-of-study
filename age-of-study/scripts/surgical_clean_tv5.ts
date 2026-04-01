import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function surgicalClean() {
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('code', 'TV5')
    .single()

  if (!subject) {
    console.error('TV5 subject not found')
    return
  }

  const affectedWeeks = [27, 35]
  console.log(`Cleaning TV5 nodes for weeks: ${affectedWeeks.join(', ')}...`)

  const { data: nodes } = await supabase
    .from('nodes')
    .select('id, title, week_number')
    .eq('subject_id', subject.id)
    .in('week_number', affectedWeeks)

  if (!nodes || nodes.length === 0) {
    console.log('No nodes found for these weeks.')
    return
  }

  const nodeIds = nodes.map(n => n.id)
  console.log(`Found ${nodeIds.length} nodes to remove.`)

  // Cleanup related data
  const { error: lessonSectionsError } = await supabase.from('lesson_sections').delete().in('node_id', nodeIds)
  if (lessonSectionsError) console.error('Error deleting lesson_sections:', lessonSectionsError)

  const { error: progressError } = await supabase.from('student_node_progress').delete().in('node_id', nodeIds)
  if (progressError) console.error('Error deleting student_node_progress:', progressError)

  // Update other foreign keys to null
  const { error: questionsError } = await supabase.from('questions').update({ node_id: null }).in('node_id', nodeIds)
  if (questionsError) console.error('Error updating questions:', questionsError)

  const { error: testsError } = await supabase.from('tests').update({ node_id: null }).in('node_id', nodeIds)
  if (testsError) console.error('Error updating tests:', testsError)

  const { error: chunksError } = await supabase.from('document_chunks').update({ node_id: null }).in('node_id', nodeIds)
  if (chunksError) console.error('Error updating document_chunks:', chunksError)

  // Finally delete the nodes
  const { error: deleteError } = await supabase
    .from('nodes')
    .delete()
    .in('id', nodeIds)

  if (deleteError) {
    console.error('Error deleting nodes:', deleteError)
  } else {
    console.log('Successfully cleaned affected nodes.')
  }
}

surgicalClean().catch(console.error)
