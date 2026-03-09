/**
 * Import crawled Tiếng Việt 5 data as linked-list skill tree nodes + lesson_sections
 * 
 * Creates 2 lesson nodes per week as linked list:
 *   Bài odd (parent=NULL) → Bài even (parent=Bài odd)
 * 
 * Weeks 1-18 → volume 1 (Tập 1), weeks 19-35 → volume 2 (Tập 2)
 * Review weeks (9, 18, 27, 35) handled as Ôn tập/Đánh giá nodes
 * 
 * Usage:
 *   npx tsx scripts/import-lesson-sections.ts [--clean] [path/to/json]
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types matching crawled JSON structure
interface CrawledSection {
  content_label: string
  title: string
  url: string
  content: string
  qa_pairs: { question: string; answer: string }[]
  remember?: string
  images: { url: string; alt: string; context: string }[]
}

interface CrawledLesson {
  lesson_number: number
  title: string
  sections: CrawledSection[]
}

interface CrawledWeek {
  week_number: number
  theme: string
  lessons: CrawledLesson[]
}

interface CrawledData {
  textbook: string
  crawled_at?: string
  weeks: CrawledWeek[]
}

function getVolumeNumber(weekNumber: number): number {
  return weekNumber <= 18 ? 1 : 2
}

function mapSectionType(contentLabel: string): string {
  const label = contentLabel.toLowerCase()
  if (label.includes('tập đọc') || label.includes('đọc')) return 'reading'
  if (label.includes('luyện từ') || label.includes('câu') || label.includes('đại từ') ||
      label.includes('kết từ') || label.includes('ngữ pháp') || label.includes('liên kết') ||
      label.includes('dấu gạch') || label.includes('từ đồng') || label.includes('từ đa') ||
      label.includes('từ điển') || label.includes('viết hoa') || label.includes('tên người')) return 'grammar'
  if (label.includes('viết') || label.includes('văn') || label.includes('dàn ý') ||
      label.includes('tập làm') || label.includes('quan sát') || label.includes('chương trình hoạt động')) return 'writing'
  if (label.includes('câu hỏi')) return 'comprehension'
  return 'other'
}

async function getTiengViet5SubjectId(): Promise<number> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('code', 'TV5')
    .single()
  
  if (error || !data) {
    throw new Error('TV5 subject not found. Please create it first.')
  }
  return data.id
}

// Find or create node matching unique constraint (subject_id, title, node_type, volume_number)
async function findOrCreateNode(params: {
  subjectId: number
  parentId: number | null
  title: string
  description: string
  nodeType: string
  weekNumber: number
  volumeNumber: number
  orderIndex: number
  positionX: number
  positionY: number
}): Promise<number> {
  const { subjectId, parentId, title, description, nodeType, weekNumber, volumeNumber, orderIndex, positionX, positionY } = params

  // Dedup query matching the unique index (subject_id, title, node_type, volume_number)
  const { data: existing } = await supabase
    .from('nodes')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('title', title)
    .eq('node_type', nodeType)
    .eq('volume_number', volumeNumber)
    .maybeSingle()
  
  if (existing) {
    console.log(`  ↳ Found existing: ${title}`)
    return existing.id
  }
  
  const { data: newNode, error } = await supabase
    .from('nodes')
    .insert({
      subject_id: subjectId,
      parent_node_id: parentId,
      title,
      description,
      node_type: nodeType,
      week_number: weekNumber,
      volume_number: volumeNumber,
      order_index: orderIndex,
      position_x: positionX,
      position_y: positionY,
    })
    .select('id')
    .single()
  
  if (error || !newNode) {
    throw new Error(`Failed to create node: ${title}. Error: ${error?.message}`)
  }
  
  console.log(`  ✓ Created: ${title}`)
  return newNode.id
}

// Clean all TV5 nodes before re-import
async function cleanTV5Nodes(subjectId: number) {
  console.log('🗑️  Cleaning all TV5 nodes...')
  
  const { data: nodes } = await supabase
    .from('nodes')
    .select('id')
    .eq('subject_id', subjectId)

  if (!nodes || nodes.length === 0) {
    console.log('   No nodes to clean.')
    return
  }

  const nodeIds = nodes.map(n => n.id)

  // Cascade cleanup related data
  await supabase.from('lesson_sections').delete().in('node_id', nodeIds)
  await supabase.from('student_node_progress').delete().in('node_id', nodeIds)
  await supabase.from('questions').update({ node_id: null }).in('node_id', nodeIds)
  await supabase.from('tests').update({ node_id: null }).in('node_id', nodeIds)
  await supabase.from('document_chunks').update({ node_id: null }).in('node_id', nodeIds)
  
  // Delete nodes: children first, then parents
  await supabase.from('nodes').delete().eq('subject_id', subjectId).not('parent_node_id', 'is', null)
  await supabase.from('nodes').delete().eq('subject_id', subjectId).is('parent_node_id', null)
  
  console.log(`   ✓ Cleaned ${nodeIds.length} nodes and related data`)
}

// Main import function
async function importLessonSections() {
  const args = process.argv.slice(2)
  const shouldClean = args.includes('--clean')
  const customPath = args.find(a => !a.startsWith('--'))
  const jsonPath = customPath || path.join(process.cwd(), 'data', 'crawled', 'tiengviet5-full.json')
  
  console.log('📚 Import TV5 Linked-List Skill Tree\n')
  
  if (!fs.existsSync(jsonPath)) {
    // Fallback to tap1 file if full doesn't exist
    const fallbackPath = path.join(process.cwd(), 'data', 'crawled', 'tiengviet5-tap1.json')
    if (!fs.existsSync(fallbackPath)) {
      console.error(`❌ File not found: ${jsonPath}`)
      console.error('   Run the crawler first: npx tsx scripts/crawl-loigiaihay.ts')
      process.exit(1)
    }
    console.log(`⚠️  ${jsonPath} not found, using fallback: tiengviet5-tap1.json`)
  }
  
  const actualPath = fs.existsSync(jsonPath) ? jsonPath : path.join(process.cwd(), 'data', 'crawled', 'tiengviet5-tap1.json')
  const data: CrawledData = JSON.parse(fs.readFileSync(actualPath, 'utf-8'))
  
  console.log(`📖 Loaded: ${data.textbook}`)
  console.log(`📅 Weeks: ${data.weeks.length}\n`)
  
  const subjectId = await getTiengViet5SubjectId()
  console.log(`✓ TV5 subject ID: ${subjectId}\n`)
  
  if (shouldClean) {
    await cleanTV5Nodes(subjectId)
    console.log('')
  }
  
  let nodeCount = 0
  let sectionCount = 0
  let skipCount = 0
  
  for (const week of data.weeks) {
    const weekNum = week.week_number
    const volume = getVolumeNumber(weekNum)
    
    console.log(`\n📅 Week ${weekNum}: ${week.theme} (Tập ${volume})`)
    
    // Sort lessons by lesson_number
    const sortedLessons = [...week.lessons].sort((a, b) => a.lesson_number - b.lesson_number)
    
    // Position layout: each week stacks downward, 2 nodes per week in a vertical chain
    // Use global week index (1-35) so Tập 1 and Tập 2 never overlap even if both show at once:
    //   Tập 1 weeks 1-18  → y = 0..8500
    //   Tập 2 weeks 19-35 → y = 9000..17000
    const weekRow = weekNum - 1
    const posYBase = weekRow * 500  // Each week block: 200px node gap + 300px breathing room
    const posX = 0                  // All nodes in a single vertical column
    
    let prevNodeId: number | null = null
    
    for (let i = 0; i < sortedLessons.length; i++) {
      const lesson = sortedLessons[i]
      const posY = posYBase + i * 200
      const orderIndex = (weekNum - 1) * 10 + (i + 1)
      
      // Build node title from lesson data
      const nodeTitle = `Bài ${lesson.lesson_number}: ${lesson.title}`
      
      // Create lesson node: linked list within week
      // First lesson in week → parent=NULL, subsequent → parent=previous
      const nodeId = await findOrCreateNode({
        subjectId,
        parentId: prevNodeId,
        title: nodeTitle,
        description: `Tuần ${weekNum} - ${week.theme}`,
        nodeType: 'lesson',
        weekNumber: weekNum,
        volumeNumber: volume,
        orderIndex,
        positionX: posX,
        positionY: posY,
      })
      nodeCount++
      
      // Import lesson sections (content grouped under this lesson node)
      for (const section of lesson.sections) {
        // Skip empty sections
        if (!section.content && (!section.qa_pairs || section.qa_pairs.length === 0) && !section.remember) {
          skipCount++
          continue
        }
        
        const sectionType = mapSectionType(section.content_label)
        
        const { error: insertError } = await supabase
          .from('lesson_sections')
          .insert({
            node_id: nodeId,
            section_type: sectionType,
            title: section.title,
            content: section.content || '',
            qa_pairs: section.qa_pairs || [],
            remember: section.remember || null,
            images: section.images || [],
            source_url: section.url,
          })
        
        if (insertError) {
          console.error(`    ❌ Section: ${section.title} - ${insertError.message}`)
        } else {
          sectionCount++
          const qaCount = section.qa_pairs?.length || 0
          console.log(`    ✓ ${section.content_label}: ${section.title} (${qaCount} Q&A)`)
        }
      }
      
      prevNodeId = nodeId // Link next lesson to this one
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ IMPORT COMPLETE!')
  console.log('='.repeat(60))
  console.log(`📊 Summary:`)
  console.log(`   - Nodes created: ${nodeCount}`)
  console.log(`   - Sections imported: ${sectionCount}`)
  console.log(`   - Sections skipped: ${skipCount}`)
  console.log('\n')
}

// Run import
importLessonSections()
  .then(() => {
    console.log('🎉 Import script finished successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error.message)
    console.error(error)
    process.exit(1)
  })
