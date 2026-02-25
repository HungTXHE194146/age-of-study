/**
 * Import crawled Tiếng Việt 5 data to lesson_sections table
 * 
 * This script:
 * 1. Reads tiengviet5-tap1.json
 * 2. Creates curriculum nodes if they don't exist
 * 3. Imports sections to lesson_sections table with Q&A pairs
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Initialize Supabase client with service role key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Map content_label to section_type enum
function mapSectionType(contentLabel: string): string {
  const label = contentLabel.toLowerCase()
  
  if (label.includes('tập đọc')) return 'reading'
  if (label.includes('luyện từ') || label.includes('câu')) return 'grammar'
  if (label.includes('tập làm văn') || label.includes('viết')) return 'writing'
  if (label.includes('câu hỏi')) return 'comprehension'
  
  return 'other'
}

// Get TV5 subject ID
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

// Find or create node by title
async function findOrCreateNode(
  subjectId: number,
  parentId: number | null,
  title: string,
  description: string
): Promise<number> {
  // Try to find existing node
  const { data: existing } = await supabase
    .from('nodes')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('title', title)
    .eq('parent_node_id', parentId)
    .maybeSingle()
  
  if (existing) {
    return existing.id
  }
  
  // Create new node
  const { data: newNode, error } = await supabase
    .from('nodes')
    .insert({
      subject_id: subjectId,
      parent_node_id: parentId,
      title,
      description
    })
    .select('id')
    .single()
  
  if (error || !newNode) {
    throw new Error(`Failed to create node: ${title}. Error: ${error?.message}`)
  }
  
  console.log(`  ✓ Created node: ${title}`)
  return newNode.id
}

// Main import function
async function importLessonSections() {
  console.log('📚 Starting import of Tiếng Việt 5 lesson sections...\n')
  
  // Load JSON data
  const jsonPath = path.join(process.cwd(), 'data', 'crawled', 'tiengviet5-tap1.json')
  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const data = JSON.parse(rawData)
  
  console.log(`📖 Loaded: ${data.textbook}`)
  console.log(`📅 Crawled: ${data.crawled_at}`)
  console.log(`\n`)
  
  // Get TV5 subject
  const subjectId = await getTiengViet5SubjectId()
  console.log(`✓ Found subject TV5 (ID: ${subjectId})\n`)
  
  // Stats
  let weekCount = 0
  let lessonCount = 0
  let sectionCount = 0
  let skipCount = 0
  
  // Process each week
  for (const week of data.weeks) {
    weekCount++
    console.log(`\n📅 Week ${week.week_number}: ${week.theme}`)
    
    // Find or create week node
    const weekNodeId = await findOrCreateNode(
      subjectId,
      null, // Top-level node
      week.theme,
      `Week ${week.week_number}`
    )
    
    // Process each lesson
    for (const lesson of week.lessons) {
      lessonCount++
      console.log(`  📖 Bài ${lesson.lesson_number}: ${lesson.title}`)
      
      // Find or create lesson node
      const lessonNodeId = await findOrCreateNode(
        subjectId,
        weekNodeId,
        `Bài ${lesson.lesson_number}: ${lesson.title}`,
        `Lesson ${lesson.lesson_number}`
      )
      
      // Process each section
      for (const section of lesson.sections) {
        // Map section type
        const sectionType = mapSectionType(section.content_label)
        
        // Skip if no meaningful content
        if (!section.content && section.qa_pairs.length === 0 && !section.remember) {
          console.log(`    ⊘ Skipped: ${section.title} (no content)`)
          skipCount++
          continue
        }
        
        // Find or create section node
        const sectionNodeId = await findOrCreateNode(
          subjectId,
          lessonNodeId,
          section.title,
          section.content_label
        )
        
        // Insert section data
        const { error: insertError } = await supabase
          .from('lesson_sections')
          .insert({
            node_id: sectionNodeId,
            section_type: sectionType,
            title: section.title,
            content: section.content || '',
            qa_pairs: section.qa_pairs || [],
            remember: section.remember || null,
            images: section.images || [],
            source_url: section.url
          })
        
        if (insertError) {
          console.error(`    ❌ Error inserting: ${section.title}`)
          console.error(`       ${insertError.message}`)
        } else {
          sectionCount++
          const qaCount = section.qa_pairs?.length || 0
          const rememberStatus = section.remember ? '✓' : '-'
          console.log(`    ✓ ${section.title} (${sectionType}, ${qaCount} Q&A, remember: ${rememberStatus})`)
        }
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('✅ IMPORT COMPLETED!')
  console.log('='.repeat(80))
  console.log(`📊 Summary:`)
  console.log(`   - Weeks processed: ${weekCount}`)
  console.log(`   - Lessons processed: ${lessonCount}`)
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
