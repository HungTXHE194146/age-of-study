/**
 * Auto-create Tests from existing TV5 question bank
 *
 * For each TV5 node that has questions in `questions` table but no published test:
 *   1. Creates a `tests` row (type=practice, is_published=true)
 *   2. Links all node questions via `test_questions` mapping
 *
 * Usage:
 *   npx tsx scripts/create-tv5-tests.ts [--dry-run] [--volume N]
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const volIdx = args.indexOf('--volume')
const onlyVolume = volIdx !== -1 ? parseInt(args[volIdx + 1]) : null

async function main() {
  console.log('🧪 TV5 Test Creator')
  console.log('==========================')
  if (dryRun) console.log('🔍 DRY RUN MODE — no DB writes')
  if (onlyVolume) console.log(`📗 Only volume: ${onlyVolume}`)

  // 1. Get the TV5 subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .ilike('name', '%tiếng việt%5%')
    .single()

  if (!subject) {
    console.error('❌ Could not find TV5 subject')
    process.exit(1)
  }
  console.log(`📚 Subject: ${subject.name} (id=${subject.id})\n`)

  // 2. Get all TV5 lesson nodes
  let nodesQuery = supabase
    .from('nodes')
    .select('id, title, week_number, order_index')
    .eq('subject_id', subject.id)
    .eq('node_type', 'lesson')
    .order('order_index', { ascending: true })

  const { data: nodes, error: nodesErr } = await nodesQuery
  if (nodesErr || !nodes) {
    console.error('❌ Failed to fetch nodes:', nodesErr?.message)
    process.exit(1)
  }

  // Filter by volume if specified
  const filteredNodes = onlyVolume
    ? nodes.filter(n => {
        const vol = (n.week_number ?? 0) <= 18 ? 1 : 2
        return vol === onlyVolume
      })
    : nodes

  console.log(`📋 Found ${filteredNodes.length} lesson nodes\n`)

  let created = 0
  let skipped = 0
  let noQuestions = 0

  for (const node of filteredNodes) {
    const vol = (node.week_number ?? 0) <= 18 ? 1 : 2
    const prefix = `[Week ${node.week_number} T${vol}]`

    // 3. Check if node already has a published test
    const { data: existingTests } = await supabase
      .from('tests')
      .select('id')
      .eq('node_id', node.id)
      .eq('is_published', true)
      .limit(1)

    if (existingTests && existingTests.length > 0) {
      console.log(`⏭  ${prefix} ${node.title} — already has published test`)
      skipped++
      continue
    }

    // 4. Get all questions for this node
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('node_id', node.id)

    if (!questions || questions.length === 0) {
      console.log(`⚠️  ${prefix} ${node.title} — no questions in bank`)
      noQuestions++
      continue
    }

    console.log(`📖 ${prefix} ${node.title} — ${questions.length} questions`)

    if (dryRun) {
      console.log(`  🔍 [dry-run] Would create test + link ${questions.length} questions`)
      created++
      continue
    }

    // 5. Create the test
    const { data: test, error: testErr } = await supabase
      .from('tests')
      .insert({
        title: `Luyện tập: ${node.title}`,
        description: `Bài luyện tập tự động cho ${node.title}`,
        type: 'practice',
        node_id: node.id,
        subject_id: subject.id,
        is_published: true,
        settings: {
          time_limit: 15,
          allow_retry: true,
          shuffle_questions: true,
        },
        max_xp: questions.length * 10,
      })
      .select('id')
      .single()

    if (testErr || !test) {
      console.error(`  ❌ Failed to create test: ${testErr?.message}`)
      continue
    }

    // 6. Link questions to test via test_questions
    const mappingRows = questions.map((q, idx) => ({
      test_id: test.id,
      question_id: q.id,
      points: 10,
      display_order: idx,
    }))

    const { error: mapErr } = await supabase
      .from('test_questions')
      .insert(mappingRows)

    if (mapErr) {
      console.error(`  ❌ Failed to link questions: ${mapErr.message}`)
      continue
    }

    console.log(`  ✅ Created test (${test.id}) with ${questions.length} questions`)
    created++
  }

  console.log('\n==================================================')
  console.log(`✅ DONE`)
  console.log(`   Tests created: ${created}`)
  console.log(`   Nodes skipped (had test): ${skipped}`)
  console.log(`   Nodes without questions: ${noQuestions}`)
  if (dryRun) console.log(`   (dry-run: nothing written to DB)`)
}

main().catch(console.error)
