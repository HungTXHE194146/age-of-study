/**
 * Auto-generate multiple-choice questions for TV5 lesson nodes
 *
 * Strategy:
 *   - For each TV5 node, pull all lesson_sections (content + qa_pairs from loigiaihay)
 *   - Feed content + official Q&As as context to Gemini
 *   - Generate 3-5 grade-5-appropriate multiple-choice questions per node
 *   - Insert into `questions` table with node_id
 *
 * Usage:
 *   npx tsx scripts/generate-tv5-questions.ts [--dry-run] [--week N] [--volume N]
 *
 *   --dry-run    Show what would be generated without inserting to DB
 *   --week N     Only process a specific week (e.g. --week 1)
 *   --volume N   Only process volume 1 or 2 (e.g. --volume 1)
 *   --overwrite  Re-generate even if node already has questions
 *
 * Multiple API keys (to bypass 20 RPD/key limit):
 *   Set GOOGLE_GEMINI_API_KEY_2, GOOGLE_GEMINI_API_KEY_3, ... in .env.local
 *   Keys are rotated round-robin; exhausted keys (RPD hit) are dropped automatically.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

// ─── Multi-key rotation ───────────────────────────────────────────────────────
// Load all available API keys: GOOGLE_GEMINI_API_KEY, GOOGLE_GEMINI_API_KEY_2, ...
function loadApiKeys(): string[] {
  const keys: string[] = []
  // Primary key
  if (process.env.GOOGLE_GEMINI_API_KEY) keys.push(process.env.GOOGLE_GEMINI_API_KEY)
  // Additional keys: _2, _3, _4, ...
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`GOOGLE_GEMINI_API_KEY_${i}`]
    if (k) keys.push(k)
  }
  return keys
}

class KeyRotator {
  private keys: string[]
  private index = 0
  private requestCounts: number[]
  private readonly RPD_LIMIT = 500     // requests per day per free key (gemini-3.1-flash-lite)
  private readonly RPM_LIMIT = 15      // requests per minute per key
  private readonly DELAY_MS = Math.ceil(60000 / this.RPM_LIMIT) + 200  // ~4.2s between requests

  constructor(keys: string[]) {
    this.keys = [...keys]
    this.requestCounts = new Array(keys.length).fill(0)
  }

  get totalKeys() { return this.keys.length }
  get remainingKeys() { return this.keys.filter((_, i) => this.requestCounts[i] < this.RPD_LIMIT).length }

  // Returns the next available GenAI client, or null if all keys exhausted
  next(): { client: GoogleGenerativeAI; keyIndex: number } | null {
    // Find next key under RPD limit (starting from current index)
    for (let attempt = 0; attempt < this.keys.length; attempt++) {
      const i = (this.index + attempt) % this.keys.length
      if (this.requestCounts[i] < this.RPD_LIMIT) {
        this.index = (i + 1) % this.keys.length
        this.requestCounts[i]++
        return { client: new GoogleGenerativeAI(this.keys[i]), keyIndex: i + 1 }
      }
    }
    return null  // All keys exhausted
  }

  get delay() { return this.DELAY_MS }

  summary() {
    return this.keys.map((_, i) => `Key ${i + 1}: ${this.requestCounts[i]}/${this.RPD_LIMIT}`).join(', ')
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LessonSection {
  id: number
  section_type: string
  title: string
  content: string
  qa_pairs: { question: string; answer: string }[]
  remember: string | null
}

interface GeneratedQuestion {
  questionText: string
  passage?: string          // Trích đoạn 2-3 câu nhúng vào câu hỏi (chỉ cho comprehension)
  options: { label: string; text: string; isCorrect: boolean }[]
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
  question_type: 'comprehension' | 'grammar' | 'vocabulary'
}

interface TV5Node {
  id: number
  title: string
  week_number: number
  volume_number: number
  description: string
}

// ─── Gemini prompt ────────────────────────────────────────────────────────────

// Max chars of passage content to include — prevents Gemini output truncation
const MAX_CONTENT_CHARS = 2500  // 10 questions need more context
const MAX_QA_PAIRS = 8

function buildPrompt(node: TV5Node, sections: LessonSection[]): string {
  // Section type mapping từ mapSectionType() trong import script:
  //   'other'   = bài đọc chính (Thanh âm của gió, Cánh đồng hoa, ...)
  //   'reading' = đọc mở rộng
  //   'grammar' = luyện từ và câu
  //   'writing' = tập làm văn (KHÔNG dùng để tạo câu hỏi đọc hiểu)
  const readingSections = sections.filter(s =>
    s.section_type === 'other' || s.section_type === 'reading' || s.section_type === 'comprehension'
  )
  const supportSections = sections.filter(s =>
    s.section_type === 'grammar'
  )
  // writing sections bị loại hoàn toàn — tránh Gemini sinh câu hỏi kỹ thuật viết văn

  // Use reading sections first; fall back to all non-writing sections if none
  const primarySections = readingSections.length > 0 ? readingSections : supportSections

  const contextParts: string[] = []

  for (const section of primarySections) {
    if (section.content?.trim()) {
      // Truncate long passages — keep first MAX_CONTENT_CHARS characters
      const truncated = section.content.trim().slice(0, MAX_CONTENT_CHARS)
      const suffix = section.content.trim().length > MAX_CONTENT_CHARS ? '...' : ''
      contextParts.push(`## ${section.title}\n${truncated}${suffix}`)
    }
    if (section.qa_pairs?.length) {
      // Only include first MAX_QA_PAIRS Q&As to stay within token budget
      const qaText = section.qa_pairs
        .slice(0, MAX_QA_PAIRS)
        .map(qa => `Hỏi: ${qa.question}\nĐáp: ${qa.answer}`)
        .join('\n')
      contextParts.push(`### Câu hỏi sách giáo khoa:\n${qaText}`)
    }
    if (section.remember?.trim()) {
      contextParts.push(`### Ghi nhớ:\n${section.remember.trim().slice(0, 300)}`)
    }
  }

  // Include only qa_pairs from non-reading sections (no full content — keeps prompt short)
  for (const section of supportSections) {
    if (section.qa_pairs?.length) {
      const qaText = section.qa_pairs
        .slice(0, 3)
        .map(qa => `Hỏi: ${qa.question}\nĐáp: ${qa.answer}`)
        .join('\n')
      contextParts.push(`### ${section.title} (câu hỏi luyện tập):\n${qaText}`)
    }
  }

  const readingContext = contextParts.join('\n\n')

  // Grammar context: chỉ lấy qa_pairs từ grammar sections
  const grammarQAs = supportSections
    .flatMap(s => (s.qa_pairs || []).slice(0, 3))
    .map(qa => `Hỏi: ${qa.question}\nĐáp: ${qa.answer}`)
    .join('\n')

  const hasGrammar = grammarQAs.length > 0

  return `Bạn là giáo viên Tiếng Việt lớp 5. Tạo đúng 3 câu hỏi trắc nghiệm cho học sinh lớp 5 (10-11 tuổi) dựa trên bài học dưới đây.

**Bài học:** ${node.title} (Tuần ${node.week_number}, Tập ${node.volume_number})

**NỘI DUNG BÀI ĐỌC:**
${readingContext}
${
  hasGrammar
  ? `\n**CÂU HỎI LUYỆN TỪ VÀ CÂU (từ sách giáo khoa):**\n${grammarQAs}`
  : ''
}

**TẠO ĐÚNG 10 CÂU HỎI theo tỉ lệ sau:**

**Loại 1 — ĐỌC HIỂU (6 câu)** — dựa trực tiếp vào bài đọc chính:
- Trích nguyên văn 2-3 câu liên quan TỪ BÀI ĐỌC TRÊN vào trường "passage"
- questionText hỏi về đoạn trích đó (không nhắc lại nội dung passage)
- Ví dụ: passage = "Mư Hoa nhìn bãi rác rồi nói: 'Chúng mình hãy trồng hoa ở đây đi!'"
          questionText = "Mư Hoa đề nghị các bạn làm gì?"
- Phân bổ: 3 câu dễ (chi tiết rõ), 2 câu vừa (suy luận), 1 câu khó (chủ đề/ý nghĩa)
- question_type = "comprehension"

**Loại 2 — NGỮ PHÁP/TỪ VỰNG (4 câu)** — standalone, không cần đọc lại bài:
- passage = null
- 2 câu ngữ pháp: từ loại (danh từ/động từ/tính từ), cấu trúc câu, dấu câu — lấy câu cụ thể từ bài đọc
- 2 câu từ vựng: từ đồng nghĩa, trái nghĩa, nghĩa của từ trong ngữ cảnh — lấy từ có trong bài
- question_type = "grammar" hoặc "vocabulary"

**YÊU CẦU CHUNG:**
- Mỗi câu có 4 đáp án (A B C D), chỉ 1 đúng
- Đáp án mồi nhử lấy từ chính văn bản, hợp lý, không quá dễ lộ
- Ngôn từ đơn giản, thân thiện học sinh lớp 5
- explanation: 1 câu ngắn, thân thiện
- KHÔNG bịa chi tiết ngoài văn bản

Chỉ trả về JSON array đúng 10 phần tử, không thêm text:
[{"questionText":"...","passage":"...hoặc null nếu grammar/vocab...","question_type":"comprehension|grammar|vocabulary","options":[{"label":"A","text":"...","isCorrect":true},{"label":"B","text":"...","isCorrect":false},{"label":"C","text":"...","isCorrect":false},{"label":"D","text":"...","isCorrect":false}],"difficulty":"easy|medium|hard","explanation":"..."}]`
}

// ─── Core logic ───────────────────────────────────────────────────────────────

async function generateQuestionsForNode(
  node: TV5Node,
  sections: LessonSection[],
  subjectId: number,
  rotator: KeyRotator,
  dryRun: boolean
): Promise<number> {
  if (sections.length === 0) {
    console.log(`  ⚠️  No sections found, skipping`)
    return 0
  }

  let questions: GeneratedQuestion[] = []

  try {
    const next = rotator.next()
    if (!next) {
      console.error(`  ❌ All API keys exhausted (RPD limit reached). Add more keys or run tomorrow.`)
      process.exit(1)
    }
    const { client, keyIndex } = next
    console.log(`  🔑 Using key ${keyIndex} (${rotator.summary()})`)

    const model = client.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        // @ts-expect-error: thinkingConfig is supported at runtime but not yet in typings
        thinkingConfig: { thinkingBudget: 0 }, // disable thinking tokens — prevents output truncation
      },
    })

    const prompt = buildPrompt(node, sections)
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Strip markdown code block if Gemini wraps it anyway
    let jsonText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()

    // Robust extraction: find the outermost JSON array [...]
    const firstBracket = jsonText.indexOf('[')
    const lastBracket = jsonText.lastIndexOf(']')
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      jsonText = jsonText.slice(firstBracket, lastBracket + 1)
    }

    questions = JSON.parse(jsonText)

    if (!Array.isArray(questions) || questions.length === 0) {
      console.log(`  ⚠️  Gemini returned empty array`)
      return 0
    }
  } catch (err) {
    console.error(`  ❌ Gemini error: ${err instanceof Error ? err.message : err}`)
    return 0
  }

  if (dryRun) {
    console.log(`  🔍 [dry-run] Would insert ${questions.length} questions:`)
    questions.forEach((q, i) => {
      const correct = q.options.find(o => o.isCorrect)
      const tag = q.question_type === 'comprehension' ? '📖' : q.question_type === 'grammar' ? '✏️' : '🔤'
      console.log(`     ${i + 1}. ${tag} [${q.difficulty}] ${q.questionText}`)
      if (q.passage) console.log(`        📄 "${q.passage.slice(0, 80)}..."`)
      console.log(`        ✓ ${correct?.text}`)
    })
    return questions.length
  }

  // Insert into questions table
  const rows = questions.map(q => {
    const correctIndex = q.options.findIndex(o => o.isCorrect)
    return {
      node_id: node.id,
      subject_id: subjectId,
      content: {
        question: q.questionText,
        questionText: q.questionText,
        options: q.options,           // full option objects {label, text, isCorrect}
        passage: q.passage || null,   // trích đoạn nhúng trực tiếp vào câu hỏi
        question_type: q.question_type,
      },
      correct_option_index: correctIndex,
      difficulty: q.difficulty,
      explanation: q.explanation,
      q_type: 'multiple_choice',
      status: 'available',
      tags: [`tv5`, `week-${node.week_number}`, `vol-${node.volume_number}`, q.question_type],
    }
  })

  const { error, data } = await supabase
    .from('questions')
    .insert(rows)
    .select('id')

  if (error) {
    console.error(`  ❌ DB insert error: ${error.message}`)
    return 0
  }

  console.log(`  ✅ Inserted ${data?.length ?? 0} questions`)
  return data?.length ?? 0
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const overwrite = args.includes('--overwrite')

  const weekArg = args[args.indexOf('--week') + 1]
  const volumeArg = args[args.indexOf('--volume') + 1]
  const filterWeek = weekArg ? parseInt(weekArg) : null
  const filterVolume = volumeArg ? parseInt(volumeArg) : null

  console.log('🤖 TV5 Question Generator')
  console.log('==========================')
  if (dryRun) console.log('🔍 DRY RUN MODE — no DB writes')
  if (filterWeek) console.log(`🗓  Only week: ${filterWeek}`)
  if (filterVolume) console.log(`📚 Only volume: ${filterVolume}`)
  console.log('')

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error('❌ GOOGLE_GEMINI_API_KEY not set in .env.local')
    process.exit(1)
  }

  const apiKeys = loadApiKeys()
  const rotator = new KeyRotator(apiKeys)
  const maxNodes = apiKeys.length * 500  // 500 RPD per key (gemini-3.1-flash-lite)

  console.log(`🔑 API keys loaded: ${apiKeys.length}`)
  console.log(`📊 Max nodes this run: ${maxNodes} (${apiKeys.length} key × 500 RPD — 1 key đủ cho 70 nodes)`)
  if (apiKeys.length >= 1) {
    console.log(`✅ 1 key đủ cho toàn bộ 70 nodes (dùng ${70}/${apiKeys.length * 500} = ${Math.round(70 / (apiKeys.length * 500) * 100)}% quota)`)
  }
  console.log('')

  // Fetch TV5 subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('code', 'TV5')
    .single()

  if (!subject) {
    console.error('❌ TV5 subject not found')
    process.exit(1)
  }

  // Fetch all TV5 lesson nodes
  let nodeQuery = supabase
    .from('nodes')
    .select('id, title, week_number, volume_number, description')
    .eq('subject_id', subject.id)
    .eq('node_type', 'lesson')
    .order('week_number', { ascending: true })
    .order('order_index', { ascending: true })

  if (filterWeek) nodeQuery = nodeQuery.eq('week_number', filterWeek)
  if (filterVolume) nodeQuery = nodeQuery.eq('volume_number', filterVolume)

  const { data: nodes, error: nodeErr } = await nodeQuery
  if (nodeErr || !nodes) {
    console.error('❌ Failed to fetch nodes:', nodeErr?.message)
    process.exit(1)
  }

  console.log(`📋 Found ${nodes.length} lesson nodes to process\n`)

  let totalQuestions = 0
  let skipped = 0

  for (const node of nodes) {
    console.log(`\n📖 [Week ${node.week_number} T${node.volume_number}] ${node.title}`)

    // Skip if already has questions (unless --overwrite)
    if (!overwrite && !dryRun) {
      const { count } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('node_id', node.id)

      if (count && count > 0) {
        console.log(`  ⏭️  Already has ${count} questions, skipping (use --overwrite to regenerate)`)
        skipped++
        continue
      }
    }

    // Fetch lesson sections for this node
    const { data: sections } = await supabase
      .from('lesson_sections')
      .select('id, section_type, title, content, qa_pairs, remember')
      .eq('node_id', node.id)
      .order('id', { ascending: true })

    const count = await generateQuestionsForNode(
      node as TV5Node,
      sections || [],
      subject.id,
      rotator,
      dryRun
    )
    totalQuestions += count

    // Respect 5 RPM per key — wait between requests
    await new Promise(r => setTimeout(r, dryRun ? 0 : rotator.delay))
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ DONE')
  console.log(`   Questions generated: ${totalQuestions}`)
  console.log(`   Nodes skipped (had questions): ${skipped}`)
  if (dryRun) console.log('   (dry-run: nothing written to DB)')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
