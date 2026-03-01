import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { extractTextFromFile } from '@/lib/fileParser'

// Define TypeScript interface for question structure
interface QuestionType {
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY'
  questionText: string
  options?: Array<{
    label: string
    text: string
    isCorrect: boolean
  }>
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed'
  explanation: string
}

// ============================================================================ 
// API Route: POST /api/generate-questions
// Purpose: AI Question Generator for Teachers - Structured JSON Output
// Flow: Auth → Input Validation → File Parsing → Gemini JSON Generation → Response
// ============================================================================

// --- Gemini Setup ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

// --- Server-side Supabase client (bypasses RLS) ---
function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// --- Default AI settings ---
const DEFAULT_AI_QUESTION_TEMPERATURE = 0.3
const DEFAULT_AI_QUESTION_MAX_TOKENS = 8000

// --- Fetch system settings from DB (with fallback defaults) ---
async function getAIQuestionSettings(supabase: SupabaseClient) {
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('ai_question_temperature, ai_question_max_tokens')
      .eq('id', 1)
      .single()

    if (data) {
      return {
        temperature: Number.isFinite(parseFloat(data.ai_question_temperature)) 
          ? parseFloat(data.ai_question_temperature) 
          : DEFAULT_AI_QUESTION_TEMPERATURE,
        maxTokens: data.ai_question_max_tokens ?? DEFAULT_AI_QUESTION_MAX_TOKENS,
      }
    }  } catch {
    // Fall through to defaults
  }
  return {
    temperature: DEFAULT_AI_QUESTION_TEMPERATURE,
    maxTokens: DEFAULT_AI_QUESTION_MAX_TOKENS,
  }
}

// --- System Prompt for Vietnamese Educational Context ---
const SYSTEM_PROMPT = `Bạn là Giáo sư Cú, một chuyên gia giáo dục tiểu học tại Việt Nam. Nhiệm vụ của bạn là tạo câu hỏi trắc nghiệm dựa trên tài liệu được cung cấp.

**QUAN TRỌNG NHẤT:** Tài liệu đầu vào có thể chứa sẵn các 'Kịch bản AI Giải thích' hoặc 'Logic phản hồi'. 
1. Bạn phải TẬN DỤNG TỐI ĐA các kịch bản giải thích này. 
2. Trong chuỗi JSON trả về, trường \`explanation\` BẮT BUỘC phải viết theo phong cách vui vẻ, khích lệ (gọi học sinh là 'Hiệp sĩ ơi').
3. Lời giải thích phải đi sâu vào việc chỉ ra tại sao đáp án kia sai (nhầm lẫn phổ biến), và hướng dẫn học sinh dùng các 'phép thử' (như thêm từ đang/đã/sẽ, hoặc thêm từ rất/quá) đúng như tài liệu hướng dẫn.

YÊU CẦU BẮT BUỘC:
1. Trả về kết quả CHỈ DƯỚI DẠNG MỘT MẢNG JSON, không kèm markdown code block.
2. Cấu trúc JSON phải chính xác theo schema được cung cấp.
3. Nội dung câu hỏi phải phù hợp với học sinh tiểu học (6-10 tuổi).
4. Đảm bảo tính giáo dục, không có nội dung bạo lực, người lớn, hoặc không phù hợp lứa tuổi.
5. Câu hỏi phải rõ ràng, dễ hiểu, không gây nhầm lẫn.

Nếu tài liệu không phù hợp hoặc không thể tạo câu hỏi, hãy trả về mảng rỗng [].

Hãy suy nghĩ kỹ và tạo ra các câu hỏi chất lượng cao.`

// --- Expected JSON Schema ---
const JSON_SCHEMA = `
[
  {
    "type": "MULTIPLE_CHOICE | TRUE_FALSE | ESSAY",
    "questionText": "Nội dung câu hỏi...",
    "options": [
      {"label": "A", "text": "...", "isCorrect": true},
      {"label": "B", "text": "...", "isCorrect": false},
      {"label": "C", "text": "...", "isCorrect": false},
      {"label": "D", "text": "...", "isCorrect": false}
    ],
    "difficulty": "Easy | Medium | Hard | Mixed",
    "explanation": "Giải thích chi tiết vì sao đáp án đúng..."
  }
]
`

// ============================================================================ 
// REQUEST HANDLER
// ============================================================================ 
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const formData = await request.formData()
    const textPrompt = formData.get('textPrompt') as string
    const file = formData.get('file') as File | null
    const questionCount = parseInt(formData.get('questionCount') as string)
    const difficulty = formData.get('difficulty') as string
    const subject = formData.get('subject') as string

    // 2. Validate inputs
    if (!questionCount || questionCount < 1 || questionCount > 20) {
      return NextResponse.json({ error: 'Số lượng câu hỏi phải từ 1 đến 20' }, { status: 400 })
    }

    if (!['Easy', 'Medium', 'Hard', 'Mixed'].includes(difficulty)) {
      return NextResponse.json({ error: 'Độ khó không hợp lệ' }, { status: 400 })
    }

    if (!subject || subject.trim().length === 0) {
      return NextResponse.json({ error: 'Môn học không được để trống' }, { status: 400 })
    }

    // 3. Extract content from file or use text prompt
    let content = ''
    
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Chỉ hỗ trợ file PDF, DOCX, hoặc DOC' }, { status: 400 })
      }

      // Read file buffer
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      
      // Extract text
      const parsedContent = await extractTextFromFile(fileBuffer, file.type)
      
      if (parsedContent.error) {
        return NextResponse.json({ error: parsedContent.error }, { status: 400 })
      }
      
      content = parsedContent.text
    } else if (textPrompt) {
      content = textPrompt
    } else {
      return NextResponse.json({ error: 'Vui lòng cung cấp tài liệu hoặc nội dung để tạo câu hỏi' }, { status: 400 })
    }

    // 4. Validate extracted content
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Nội dung tài liệu không hợp lệ hoặc quá ngắn' }, { status: 400 })
    }

    // 5. Authenticate user via Supabase JWT
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = getServerSupabase()

    // Verify the JWT token and get user
    const { data: { user: authUser }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    ).auth.getUser(token)

    if (authError) {
      console.error('Auth error:', authError)
      console.error('Auth error details:', {
        message: authError.message,
        code: authError.code,
        status: authError.status
      })
      return NextResponse.json({ error: 'Phiên đăng nhập hết hạn' }, { status: 401 })
    }

    if (!authUser) {
      return NextResponse.json({ error: 'Phiên đăng nhập hết hạn' }, { status: 401 })
    }

    const userId = authUser.id

    // 6. Check if user is a teacher
    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!userRole || userRole.role !== 'teacher') {
      console.error('Role check failed:', {
        userId,
        userRole,
        roleValue: userRole?.role,
        roleType: typeof userRole?.role,
        isTeacher: userRole?.role === 'teacher'
      })
      return NextResponse.json({ error: 'Chỉ giáo viên mới có thể sử dụng tính năng này' }, { status: 403 })
    }

    // 7. Build prompt for Gemini
    const prompt = `${SYSTEM_PROMPT}

Tài liệu:
${content}

Yêu cầu:
- Tạo ${questionCount} câu hỏi
- Độ khó: ${difficulty} (nếu chọn Hỗn Hợp, hãy tạo câu hỏi với các mức độ khó Easy, Medium, Hard xen kẽ)
- Môn học: ${subject}

Schema JSON:
${JSON_SCHEMA}

Hãy trả về JSON theo đúng schema trên, không thêm bất kỳ nội dung nào khác.`

    // 8. Fetch AI settings from DB
    const aiSettings = await getAIQuestionSettings(supabase)

    // 9. Call Gemini with JSON mode
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: aiSettings.temperature,
        maxOutputTokens: aiSettings.maxTokens,
      },
    })

    // 9. Generate response
    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()

    // 10. Clean up response (remove markdown code blocks if present)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()

    // 11. Parse JSON with error handling
    let questions: QuestionType[]
    try {
      questions = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw response:', text)
      
      // Try to extract JSON from response if it's wrapped in text
      const jsonMatch = text.match(/\[.*\]/)
      if (jsonMatch) {
        try {
          questions = JSON.parse(jsonMatch[0])
        } catch (secondParseError) {
          console.error('Second JSON parse attempt failed:', secondParseError)
          return NextResponse.json({ 
            error: 'AI không thể tạo câu hỏi từ tài liệu này. Vui lòng thử với tài liệu khác hoặc nội dung rõ ràng hơn.',
            rawResponse: text 
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({ 
          error: 'AI không thể tạo câu hỏi từ tài liệu này. Vui lòng thử với tài liệu khác hoặc nội dung rõ ràng hơn.',
          rawResponse: text 
        }, { status: 500 })
      }
    }

    // 12. Validate questions structure
    if (!Array.isArray(questions)) {
      return NextResponse.json({ 
        error: 'AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.',
        rawResponse: text 
      }, { status: 500 })
    }

    // 13. Filter and validate questions
    const validQuestions = questions.filter((q: { type: string; questionText: string }) => {
      return q && 
             typeof q.type === 'string' && 
             typeof q.questionText === 'string' && 
             q.questionText.trim().length > 0 &&
             ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'ESSAY'].includes(q.type)
    })

    // 14. Return response
    return NextResponse.json({
      success: true,
      questions: validQuestions,
      totalGenerated: validQuestions.length,
      requested: questionCount
    })

  } catch (error) {
    console.error('Question generation API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo câu hỏi. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}