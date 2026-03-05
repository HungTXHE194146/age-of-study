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
    console.log('>>> [API] /api/generate-questions: Request received')
    
    // 1. Parse request body
    const formData = await request.formData()
    
    // Log available keys for debugging
    const keys = Array.from(formData.keys())
    console.log('>>> [API] FormData keys:', keys)

    const textPrompt = formData.get('textPrompt') as string
    const file = formData.get('file') as File | null
    const questionCount = parseInt(formData.get('questionCount') as string)
    const difficulty = formData.get('difficulty') as string
    const subject = formData.get('subject') as string
    const onlyFromFile = formData.get('onlyFromFile') === 'true'
    const fromKnowledgeBase = formData.get('fromKnowledgeBase') === 'true'
    const fromQuestionBank = formData.get('fromQuestionBank') === 'true'
    
    // Parse action and existing questions
    const action = formData.get('action') as string || 'append'
    const existingQuestions = formData.get('existingQuestions') as string
    
    // Parse questionTypes
    let questionTypes: string[] = ['MULTIPLE_CHOICE']
    try {
      const typesStr = formData.get('questionTypes') as string
      if (typesStr) {
        questionTypes = JSON.parse(typesStr)
      }
    } catch (e) {
      console.error('Error parsing questionTypes:', e)
    }

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

    // 4. Validate and Fetch content from other sources
    const supabase = getServerSupabase()
    
    let knowledgeBaseContent = ''
    if (fromKnowledgeBase && subject) {
      console.log('>>> [API] Knowledge Base Retrieval Started')
      console.log('>>> [API] Subject:', subject, 'Prompt:', textPrompt)

      // 1. Normalize prompt to NFC and lowercase for consistent matching
      const normalizedPrompt = textPrompt?.normalize('NFC').toLowerCase() || ''
      
      // 2. Extract potential keywords with support for common Vietnamese terms
      // Match "Tuần X", "Bài X", "Tiết X", "Chương X" etc.
      const keywordRegex = /(tuần|bài|tiết|chương|tập|lớp)\s*(\d+|I+V*X*)/gi
      const keywordMatches = normalizedPrompt.match(keywordRegex)
      let keywords = keywordMatches ? keywordMatches.map(k => k.trim().normalize('NFC')) : []
      
      // Stop words specific to question generated context, including comprehensive pedagogical vocabulary
      const stopWords = [
        'tạo', 'làm', 'sinh', 'cho', 'tôi', 'bài', 'kiểm tra', 'test', 'đề', 'thi', 'trắc nghiệm', 
        'tự luận', 'câu', 'hỏi', 'ôn tập', 'môn', 'viết', 'nội dung', 'về', 'dựa', 'trên', 'của', 
        'giúp', 'nhé', 'đánh giá', 'luyện tập', '15 phút', '1 tiết', '45 phút', 'giữa kì', 'cuối kì', 
        'học kì', 'đề cương', 'tổng hợp', 'nâng cao', 'cơ bản', 'khó', 'dễ', 'thông hiểu', 'vận dụng', 
        'soạn', 'giáo án', 'trả lời', 'gợi ý', 'hệ thống', 'tổng kết', 'định kì', 'thường xuyên', 'mức độ', 'phần'
      ]
      
      // Remove stop words from the prompt to find core subject words
      let coreTopicStr = normalizedPrompt;
      stopWords.forEach(word => {
        // Regex to match whole words only
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        coreTopicStr = coreTopicStr.replace(regex, '');
      });
      coreTopicStr = coreTopicStr.trim().replace(/\s+/g, ' ');

      // If we found core topic words (e.g., "tiếng việt", "từ đồng nghĩa"), add them to keywords
      if (coreTopicStr && coreTopicStr.length > 2) {
          keywords.push(coreTopicStr);
      }
      
      // Also add subject name keywords if prompt is short and no other keywords exist
      if (keywords.length === 0 && normalizedPrompt.length < 50) {
          keywords = [normalizedPrompt]
      }

      console.log('>>> [API] Extracted Keywords (NFC):', keywords)

      // 3. Find relevant nodes in the subject (get title and description)
      let nodeQuery = supabase.from('nodes').select('id, title, description').eq('subject_id', parseInt(subject))
      
      // If keywords found, filter nodes by title
      if (keywords.length > 0) {
        const filterStr = keywords.map(k => `title.ilike.%${k}%`).join(',')
        nodeQuery = nodeQuery.or(filterStr)
      }

      const { data: nodes, error: nodeError } = await nodeQuery.limit(15)
      
      if (nodeError) console.error('Error fetching nodes:', nodeError)

      if (nodes && nodes.length > 0) {
        console.log('Found Nodes by Keywords:', nodes.map(n => n.title))
        const nodeIds = nodes.map(n => n.id)
        
        // Add node info to context
        knowledgeBaseContent += nodes.map(n => `[BÀI HỌC/CHỦ ĐỀ: ${n.title}]\n${n.description ? 'Mô tả: ' + n.description : ''}`).join('\n\n') + '\n\n'

        // 4. Fetch richer lesson_sections for these nodes
        const { data: subSections, error: sectionsError } = await supabase
          .from('lesson_sections')
          .select('title, section_type, content, qa_pairs, remember')
          .in('node_id', nodeIds)
          .limit(20) // Limit to prevent context overflow
        
        if (sectionsError) console.error('Error fetching lesson_sections:', sectionsError)

        if (subSections && subSections.length > 0) {
          console.log(`Found ${subSections.length} lesson sections.`)
          
          const sectionTexts = subSections.map(s => {
            let sectionBlock = `[PHẦN: ${s.title}] (${s.section_type})\n`
            sectionBlock += `Nội dung: ${s.content}\n`
            
            // Format qa_pairs if they exist
            if (s.qa_pairs && Array.isArray(s.qa_pairs) && s.qa_pairs.length > 0) {
              sectionBlock += `Câu hỏi & Trả lời đi kèm:\n`
              s.qa_pairs.forEach((qa: any, idx: number) => {
                sectionBlock += `  - Q: ${qa.question || qa.q}\n    A: ${qa.answer || qa.a}\n`
              })
            }
            
            // Format remember if it exists
            if (s.remember) {
              sectionBlock += `GHI NHỚ: ${s.remember}\n`
            }
            
            return sectionBlock
          })
          
          knowledgeBaseContent += sectionTexts.join('\n\n')
        }
      } else {
        console.log('No specific nodes found for subject and keywords.')
      }

      // If keywords didn't yield results, or KB is still empty, execute a FALLBACK strategy
      if (!knowledgeBaseContent && subject) {
        console.log('--- Knowledge Base Fallback Triggered ---')
        
        // Strategy B: More robust fallback - directly query lesson_sections that belong to nodes of this subject
        const { data: fallbackSections, error: fallbackError } = await supabase
          .from('lesson_sections')
          .select('title, section_type, content, qa_pairs, remember, nodes!inner(subject_id)')
          .eq('nodes.subject_id', parseInt(subject))
          .limit(10)

        if (fallbackError) {
           console.error('Fallback query error:', fallbackError)
        }

        if (fallbackSections && fallbackSections.length > 0) {
            console.log(`Found ${fallbackSections.length} fallback lesson sections directly via subject_id.`)
            knowledgeBaseContent = fallbackSections.map(s => {
                let block = `[PHẦN (Gợi ý do không tìm thấy chính xác): ${s.title}]\nNội dung: ${s.content}\n`
                if (s.remember) block += `GHI NHỚ: ${s.remember}\n`
                return block
            }).join('\n\n')
        } else {
            console.log('No fallback sections found for this subject at all.')
        }
      }
      console.log('Total KB Content Length:', knowledgeBaseContent.length)
      console.log('--- End Knowledge Base Retrieval ---')
    }

    let questionBankContent = ''
    if (fromQuestionBank && subject) {
      console.log('--- AI Question Gen: Question Bank Retrieval ---')
      const { data: existingQuestions } = await supabase
        .from('questions')
        .select('content, explanation, difficulty')
        .eq('subject_id', parseInt(subject))
        .limit(10)
      
      if (existingQuestions) {
        console.log(`Found ${existingQuestions.length} existing questions for reference.`)
        questionBankContent = existingQuestions.map(q => {
          const content = q.content as any
          return `Câu hỏi: ${content.questionText}\nĐộ khó: ${q.difficulty}\nGiải thích: ${q.explanation || 'Không có'}`
        }).join('\n---\n')
      }
      console.log('--- End Question Bank Retrieval ---')
    }

    // Combine all content
    let finalContext = ''
    
    // Use file content if provided and either 'onlyFromFile' is true or fallback is needed
    if (file && (onlyFromFile || (!fromKnowledgeBase && !fromQuestionBank))) {
      finalContext += `[NỘI DUNG TỪ FILE]:\n${content}\n\n`
    }
    
    if (fromKnowledgeBase) finalContext += `[NỘI DUNG TỪ KHO KIẾN THỨC]:\n${knowledgeBaseContent}\n\n`
    if (fromQuestionBank) finalContext += `[NỘI DUNG THAM KHẢO TỪ NGÂN HÀNG CÂU HỎI]:\n${questionBankContent}\n\n`
    
    // If we still have no context from specific sources but we have a text prompt, use it as context
    if (finalContext.trim().length === 0 && textPrompt) {
       finalContext = `[NỘI DUNG TỪ YÊU CẦU]:\n${textPrompt}`
    }

    if (!finalContext || finalContext.trim().length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy nội dung phù hợp từ các nguồn đã chọn để tạo câu hỏi.' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

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
    let prompt = `${SYSTEM_PROMPT}

**NGUỒN DỮ LIỆU ĐƯỢC CUNG CẤP (CHỈ SỬ DỤNG NỘI DUNG NÀY):**
${finalContext}

**YÊU CẦU NGHIÊM NGẶT:**
1. KHÔNG ĐƯỢC sử dụng kiến thức bên ngoài tài liệu được cung cấp ở trên.
2. Bạn CHỈ được phép tạo các loại câu hỏi sau: ${questionTypes.join(', ')}.
3. Nếu tài liệu không đủ thông tin để tạo đủ số lượng câu hỏi, chỉ tạo số lượng tối đa có thể (không được bịa thêm).
4. Nếu tài liệu hoàn toàn không liên quan đến môn học ${subject}, hãy trả về mảng rỗng [].
`;

    if (action === 'edit' && existingQuestions) {
      prompt += `
**LƯU Ý QUAN TRỌNG: CHẾ ĐỘ CHỈNH SỬA CÂU HỎI**
Người dùng yêu cầu bạn **CHỈNH SỬA** danh sách câu hỏi hiện tại dựa trên "Prompt/Yêu cầu người dùng".
Dưới đây là danh sách câu hỏi hiện tại (định dạng JSON):
${existingQuestions}

Hãy trả về danh sách câu hỏi ĐÃ ĐƯỢC CHỈNH SỬA theo đúng yêu cầu. Giữ nguyên những câu không cần sửa đổi (nếu yêu cầu không áp dụng cho tất cả). Đảm bảo số lượng câu trả về phù hợp với yêu cầu chỉnh sửa hoặc giữ nguyên số câu hiện tại nếu yêu cầu chỉnh sửa toàn bộ.
`;
    }

    prompt += `
Yêu cầu cụ thể:
- Số lượng câu hỏi cần tạo: ${action === 'edit' ? 'Linh hoạt theo yêu cầu chỉnh sửa hoặc giữ nguyên số lượng cũ' : questionCount}
- Độ khó: ${difficulty}
- Môn học: ${subject}
- Prompt/Yêu cầu người dùng (nếu có): ${textPrompt || 'Không có yêu cầu thêm'}

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