import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// API Route: POST /api/questions/generate
// Purpose: Generate quiz questions using Gemini AI based on curriculum-mapped
//          documents. Teacher selects a node → we retrieve relevant document
//          chunks → Gemini generates questions → return for review.
// ============================================================================

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface GenerateRequest {
  subjectId: number
  nodeId?: number          // Specific lesson node (if null, use whole subject)
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  questionCount: number    // How many questions to generate (1-20)
  questionType: 'multiple_choice' | 'true_false' | 'essay' | 'mixed'
  customPrompt?: string    // Optional free-form instructions from teacher
}

interface GeneratedQuestion {
  question: string
  options: string[]
  correct_option_index: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  q_type: 'multiple_choice' | 'true_false' | 'essay'
  model_answer?: string    // For essay questions
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Phiên đăng nhập hết hạn' }, { status: 401 })
    }

    // 2. Check role
    const supabase = getServerSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['admin', 'system_admin', 'teacher'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Chỉ giáo viên mới được tạo câu hỏi' }, { status: 403 })
    }

    // 3. Parse & validate
    const body: GenerateRequest = await request.json()
    const { 
      subjectId, nodeId, difficulty = 'mixed', 
      questionCount = 5, questionType = 'multiple_choice',
      customPrompt 
    } = body

    if (!subjectId) {
      return NextResponse.json({ error: 'Vui lòng chọn môn học' }, { status: 400 })
    }

    if (questionCount < 1 || questionCount > 20) {
      return NextResponse.json({ error: 'Số lượng câu hỏi phải từ 1-20' }, { status: 400 })
    }

    // 4. Get subject info
    const { data: subject } = await supabase
      .from('subjects')
      .select('id, name, code, grade_level')
      .eq('id', subjectId)
      .single()

    if (!subject) {
      return NextResponse.json({ error: 'Không tìm thấy môn học' }, { status: 404 })
    }

    // 5. Get node info (if specific node selected)
    let nodeInfo: { id: number; title: string; node_type: string } | null = null
    let descendantNodeIds: number[] = []

    if (nodeId) {
      const { data: node } = await supabase
        .from('nodes')
        .select('id, title, node_type')
        .eq('id', nodeId)
        .single()

      if (node) {
        nodeInfo = node

        // Get all descendant node IDs using recursive query
        const { data: descendants } = await supabase.rpc('get_descendant_node_ids', { p_node_id: nodeId })
        descendantNodeIds = (descendants || []).map((d: { node_id: number }) => d.node_id)
      }
    }

    // 6. Retrieve relevant content from confirmed document chunks
    const context = await retrieveContext(supabase, subjectId, descendantNodeIds)

    if (!context || context.length < 50) {
      // No document content available — generate based on curriculum topic only
      console.warn('No document content found, generating from topic name only')
    }

    // 7. Retrieve existing questions to avoid duplicates
    const existingQuestions = await getExistingQuestions(supabase, subjectId, descendantNodeIds)

    // 8. Generate questions with Gemini
    const questions = await generateQuestions({
      subject: subject as { id: number; name: string; code: string; grade_level: string | null },
      node: nodeInfo,
      context,
      existingQuestions,
      difficulty,
      questionCount,
      questionType,
      customPrompt,
    })

    // 9. Save generated questions to DB with status 'pending_review'
    const savedQuestions = await saveGeneratedQuestions(
      supabase,
      questions,
      subjectId,
      nodeId || null,
      user.id
    )

    return NextResponse.json({
      success: true,
      questions: savedQuestions,
      totalGenerated: savedQuestions.length,
      context_used: context.length > 0,
      message: `Đã tạo ${savedQuestions.length} câu hỏi. Vui lòng xem xét trước khi sử dụng.`,
    })

  } catch (error) {
    console.error('Question generation error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo câu hỏi' },
      { status: 500 }
    )
  }
}

// ============================================================================
// Context Retrieval
// ============================================================================
async function retrieveContext(
  supabase: any, // Use any to avoid Supabase client type conflicts
  subjectId: number,
  nodeIds: number[]
): Promise<string> {
  const contextParts: string[] = []

  try {
    // Get lesson sections from the new table
    let query = supabase
      .from('lesson_sections')
      .select(`
        id,
        title,
        content,
        qa_pairs,
        remember,
        section_type,
        node_id,
        nodes!inner(id, title, subject_id)
      `)
      .limit(15)

    if (nodeIds.length > 0) {
      // Query specific nodes (lesson/chapter selected by teacher)
      query = query.in('node_id', nodeIds)
    } else {
      // No specific node - get all sections for the subject
      const { data: subjectNodes } = await supabase
        .from('nodes')
        .select('id')
        .eq('subject_id', subjectId)
      
      const subjectNodeIds = (subjectNodes || []).map((n: { id: number }) => n.id)
      if (subjectNodeIds.length > 0) {
        query = query.in('node_id', subjectNodeIds)
      }
    }

    const { data: sections } = await query.order('node_id', { ascending: true })

    if (sections && sections.length > 0) {
      for (const section of sections as Array<{
        title: string
        content: string
        qa_pairs: Array<{ question: string; answer: string }>
        remember: string | null
        section_type: string
        nodes: { title: string }
      }>) {
        const sectionLabel = `[${section.nodes.title} - ${section.title}]`
        
        // Add main content (limit to ~2500 chars per section)
        if (section.content && section.content.length > 0) {
          const truncated = section.content.length > 2500
            ? section.content.substring(0, 2500) + '...'
            : section.content
          contextParts.push(`${sectionLabel}\n${truncated}`)
        }

        // Add Q&A pairs as examples (Gemini can learn question formats from these)
        if (section.qa_pairs && section.qa_pairs.length > 0) {
          contextParts.push('\n📝 Ví dụ câu hỏi từ bài học:')
          for (const qa of section.qa_pairs.slice(0, 3)) {
            const qTrunc = qa.question.length > 300 ? qa.question.substring(0, 300) + '...' : qa.question
            const aTrunc = qa.answer.length > 400 ? qa.answer.substring(0, 400) + '...' : qa.answer
            contextParts.push(`Câu hỏi: ${qTrunc}\nĐáp án: ${aTrunc}`)
          }
        }

        // Add remember section (key points to focus on)
        if (section.remember) {
          const rememberTrunc = section.remember.length > 500
            ? section.remember.substring(0, 500) + '...'
            : section.remember
          contextParts.push(`\n🎯 Điểm nhấn:\n${rememberTrunc}`)
        }
      }
    }

    // If no lesson_sections found, return empty (don't fall back to old tables)
    if (contextParts.length === 0) {
      console.warn('No lesson sections found for generation context')
      return ''
    }
  } catch (err) {
    console.error('Error retrieving context for question generation:', err)
  }

  return contextParts.join('\n\n---\n\n')
}

// ============================================================================
// Get existing questions to avoid duplicates
// ============================================================================
async function getExistingQuestions(
  supabase: any, // Use any to avoid Supabase client type conflicts
  subjectId: number,
  nodeIds: number[]
): Promise<string[]> {
  try {
    let query = supabase
      .from('questions')
      .select('content')
      .eq('subject_id', subjectId)
      .eq('status', 'available')
      .limit(50)

    if (nodeIds.length > 0) {
      query = query.in('node_id', nodeIds)
    }

    const { data } = await query.order('created_at', { ascending: false })

    if (data) {
      return data.map((q: { content: { question: string } }) => q.content.question || '').filter(Boolean)
    }
  } catch (err) {
    console.error('Error fetching existing questions:', err)
  }
  return []
}

// ============================================================================
// Gemini Question Generation
// ============================================================================
async function generateQuestions(params: {
  subject: { id: number; name: string; code: string; grade_level: string | null }
  node: { id: number; title: string; node_type: string } | null
  context: string
  existingQuestions: string[]
  difficulty: string
  questionCount: number
  questionType: string
  customPrompt?: string
}): Promise<GeneratedQuestion[]> {
  const { subject, node, context, existingQuestions, difficulty, questionCount, questionType, customPrompt } = params

  // Build difficulty instruction
  const difficultyInstruction = difficulty === 'mixed'
    ? 'Hãy tạo câu hỏi với độ khó đa dạng: khoảng 30% dễ, 50% trung bình, 20% khó.'
    : `Tất cả câu hỏi phải ở mức độ "${difficulty === 'easy' ? 'dễ' : difficulty === 'medium' ? 'trung bình' : 'khó'}".`

  // Build type instruction
  let typeInstruction = ''
  if (questionType === 'multiple_choice') {
    typeInstruction = 'Tất cả câu hỏi phải là trắc nghiệm 4 đáp án (A, B, C, D).'
  } else if (questionType === 'true_false') {
    typeInstruction = 'Tất cả câu hỏi phải là dạng Đúng/Sai (2 đáp án).'
  } else if (questionType === 'essay') {
    typeInstruction = 'Tất cả câu hỏi phải là dạng tự luận (không có đáp án trắc nghiệm).'
  } else {
    typeInstruction = 'Hãy trộn các loại câu hỏi: trắc nghiệm, đúng/sai, và tự luận.'
  }

  // Build existing questions warning
  const existingWarning = existingQuestions.length > 0
    ? `\n\nCÂU HỎI ĐÃ CÓ (TRÁNH TẠO TRÙNG):\n${existingQuestions.slice(0, 20).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : ''

  const topicContext = node
    ? `Bài học: ${node.title}`
    : `Toàn bộ môn ${subject.name}`

  const prompt = `Bạn là giáo viên ${subject.name} lớp ${subject.grade_level || '5'} tại Việt Nam.

NHIỆM VỤ: Tạo ${questionCount} câu hỏi kiểm tra cho học sinh.

MÔN HỌC: ${subject.name}
PHẠM VI: ${topicContext}
${difficultyInstruction}
${typeInstruction}

${context ? `NỘI DUNG BÀI HỌC (dùng làm cơ sở ra đề):\n${context}` : `Không có tài liệu cụ thể. Hãy tạo câu hỏi dựa trên kiến thức chung của ${topicContext}.`}
${existingWarning}
${customPrompt ? `\nYÊU CẦU BỔ SUNG CỦA GIÁO VIÊN:\n${customPrompt}` : ''}

YÊU CẦU:
1. Câu hỏi phải PHÙ HỢP với trình độ lớp ${subject.grade_level || '5'} (6-11 tuổi)
2. Ngôn ngữ TIẾNG VIỆT, rõ ràng, dễ hiểu
3. Mỗi câu hỏi trắc nghiệm phải có ĐÚNG 1 đáp án đúng
4. Giải thích ngắn gọn cho mỗi câu (1-2 câu)
5. KHÔNG trùng với câu hỏi đã có ở trên
6. Câu hỏi phải kiểm tra HIỂU BIẾT, không chỉ ghi nhớ

ĐỊNH DẠNG TRẢ VỀ (JSON array):
[
  {
    "question": "Nội dung câu hỏi",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correct_option_index": 0,
    "explanation": "Giải thích ngắn gọn",
    "difficulty": "easy|medium|hard",
    "q_type": "multiple_choice|true_false|essay",
    "model_answer": "Đáp án mẫu (chỉ cho tự luận)"
  }
]

CHÚ Ý:
- Với câu hỏi Đúng/Sai: options chỉ gồm 2 phần tử ["Đúng", "Sai"]
- Với câu hỏi tự luận: options = [], correct_option_index = -1, model_answer là bắt buộc
- Chỉ trả về JSON array, không giải thích thêm`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.8, // Higher for creative variety
      maxOutputTokens: 8000,
    },
  })

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  // Parse JSON response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Gemini response is not valid JSON')
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedQuestion[]

  // Validate and clean
  return parsed
    .filter(q => q.question && q.question.length > 5)
    .map(q => ({
      question: q.question.trim(),
      options: q.options || [],
      correct_option_index: q.correct_option_index ?? 0,
      explanation: q.explanation || '',
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      q_type: ['multiple_choice', 'true_false', 'essay'].includes(q.q_type) ? q.q_type : 'multiple_choice',
      model_answer: q.model_answer || undefined,
    }))
    .slice(0, questionCount)
}

// ============================================================================
// Save Generated Questions
// ============================================================================
async function saveGeneratedQuestions(
  supabase: any, // Use any to avoid Supabase client type conflicts
  questions: GeneratedQuestion[],
  subjectId: number,
  nodeId: number | null,
  userId: string
): Promise<Array<GeneratedQuestion & { id: string }>> {
  const saved: Array<GeneratedQuestion & { id: string }> = []

  for (const q of questions) {
    const insertData = {
      subject_id: subjectId,
      node_id: nodeId,
      content: {
        question: q.question,
        options: q.options,
        explanation: q.explanation,
      },
      correct_option_index: q.correct_option_index >= 0 ? q.correct_option_index : null,
      difficulty: q.difficulty,
      q_type: q.q_type,
      model_answer: q.model_answer || null,
      status: 'available', // Mark as available immediately (teacher reviewed at creation)
      created_by: userId,
    }

    // Use as any to bypass TypeScript client type issues
    const { data, error } = await (supabase.from('questions') as any)
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      console.error('Error saving question:', error)
      continue
    }

    saved.push({ ...q, id: data.id })
  }

  return saved
}
