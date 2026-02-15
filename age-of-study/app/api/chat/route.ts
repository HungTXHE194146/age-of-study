import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// API Route: POST /api/chat
// Purpose: AI Chatbot "Cú Mèo" - RAG-based tutoring assistant
// Flow: Auth → Rate Limit → Cache Check → Retrieval → Gemini Stream → Save
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

// --- System Prompt (from SRS Section 6.2) ---
const SYSTEM_PROMPT = `Bạn là Cú Mèo 🦉 - trợ giảng vui tính dành cho học sinh tiểu học (6-10 tuổi).

QUY TẮC BẮT BUỘC:
1. CHỈ trả lời dựa trên "Kiến thức bài học" được cung cấp bên dưới. Nếu câu hỏi KHÔNG liên quan đến kiến thức được cung cấp, hãy từ chối khéo: "Câu hỏi này nằm ngoài bài học của mình rồi, hỏi thầy/cô giáo nhé! 🦉"
2. KHÔNG BAO GIỜ giải bài tập hộ. Hãy dùng phương pháp Socratic (đặt câu hỏi gợi mở) để học sinh TỰ suy nghĩ.
   - Ví dụ: Thay vì nói "Đáp án là B", hãy hỏi "Bạn thử nghĩ xem, nếu chia 12 cho 3 thì được mấy nhỉ? 🤔"
3. Giọng điệu: Vui vẻ, thân thiện, dùng emoji 🌟 ✨ 🎯, ngắn gọn dễ hiểu.
4. Trả lời bằng tiếng Việt. Câu trả lời phải ngắn gọn (tối đa 150 từ).
5. Nếu học sinh hỏi về nội dung bạo lực, người lớn, gian lận, hoặc không phù hợp lứa tuổi → Từ chối: "Mình không thể trả lời câu hỏi này. Hãy tập trung vào bài học nhé! 📚"
6. Khuyến khích học sinh khi họ cố gắng, dùng lời khen tích cực.`

// --- Constants ---
const RATE_LIMIT_PER_MINUTE = 10
const MAX_CONTEXT_QUESTIONS = 15
const MAX_CONTEXT_DOCUMENTS = 5
const MAX_CONVERSATION_HISTORY = 10
const CACHE_TTL_HOURS = 24

// ============================================================================
// REQUEST HANDLER
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json()
    const { message, subjectId, conversationHistory = [] } = body as {
      message: string
      subjectId?: number | null
      conversationHistory: Array<{ role: 'user' | 'bot'; text: string }>
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Tin nhắn không được để trống' }, { status: 400 })
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Tin nhắn quá dài (tối đa 1000 ký tự)' }, { status: 400 })
    }

    // 2. Authenticate user via Supabase JWT
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = getServerSupabase()

    // Verify the JWT token and get user
    const { data: { user: authUser }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    ).auth.getUser(token)

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Phiên đăng nhập hết hạn' }, { status: 401 })
    }

    const userId = authUser.id

    // 3. Rate limit check - count recent messages in chat_logs
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('chat_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('sender', 'user')
      .gte('created_at', oneMinuteAgo)

    if ((recentCount || 0) >= RATE_LIMIT_PER_MINUTE) {
      return NextResponse.json(
        { error: 'Cú Mèo đang trả lời bạn khác, chờ chút nha~ 🦉', retryAfter: 10 },
        { status: 429 }
      )
    }

    // 4. Cache check - hash the message + subject for lookup
    const normalizedMessage = message.trim().toLowerCase().replace(/\s+/g, ' ')
    const cacheKey = await hashMessage(normalizedMessage + (subjectId || ''))

    const { data: cached } = await supabase
      .from('chat_cache')
      .select('response, id')
      .eq('question_hash', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached) {
      // Cache HIT - return immediately, save logs in background
      saveChatLogs(supabase, userId, message, cached.response, subjectId)

      return NextResponse.json({ 
        response: cached.response, 
        cached: true 
      })
    }

    // 5. RETRIEVAL - Find relevant content from DB
    const context = await retrieveContext(supabase, normalizedMessage, subjectId)

    // 6. BUILD PROMPT & CALL GEMINI with streaming
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      ],
      generationConfig: {
        maxOutputTokens: 500,   // Keep responses short (elementary school)
        temperature: 0.7,       // Slightly creative but not too random
      },
    })

    // Build conversation history for Gemini
    const geminiHistory = conversationHistory
      .slice(-MAX_CONVERSATION_HISTORY)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }],
      }))

    const chat = model.startChat({
      history: [
        // System instruction as first message
        { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n--- Kiến thức bài học ---\n' + context }] },
        { role: 'model', parts: [{ text: 'Mình đã hiểu! Mình là Cú Mèo 🦉, sẽ chỉ trả lời dựa trên kiến thức bài học được cung cấp, dùng phương pháp gợi mở, và giọng vui vẻ thân thiện. Sẵn sàng giúp bạn! ✨' }] },
        // Past conversation
        ...geminiHistory,
      ],
    })

    // 7. Stream the response
    const result = await chat.sendMessageStream(message)

    let fullResponse = ''

    // Create a ReadableStream to pipe Gemini's streaming output
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              fullResponse += text
              // Send each chunk as a Server-Sent Event
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }

          // Send done signal
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()

          // 8. AFTER STREAM: Save to chat_logs and cache
          await saveChatLogs(supabase, userId, message, fullResponse, subjectId)
          await saveToCache(supabase, cacheKey, normalizedMessage, fullResponse, subjectId)

        } catch (error) {
          console.error('Gemini streaming error:', error)
          
          // Check if this is a safety block
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const isSafetyBlock = errorMessage.includes('SAFETY') || errorMessage.includes('blocked')
          
          const fallbackText = isSafetyBlock
            ? 'Câu hỏi này nằm ngoài bài học, hỏi cô/thầy giáo nhé! 🦉'
            : 'Cú Mèo đang bận quá, bạn thử lại sau nhé! 🦉'

          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text: fallbackText, error: true })}\n\n`)
          )
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()

          // Log blocked message
          if (isSafetyBlock) {
            await supabase.from('chat_logs').insert({
              user_id: userId,
              sender: 'user',
              message: message,
              is_blocked: true,
              subject_id: subjectId || null,
            })
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra, vui lòng thử lại sau' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Retrieve relevant context from questions and documents tables
 * Uses PostgreSQL full-text search to find matching content
 */
async function retrieveContext(
  supabase: SupabaseClient,
  message: string,
  subjectId?: number | null
): Promise<string> {
  const contextParts: string[] = []

  // Extract search keywords from the message
  // Simple approach: split by spaces, remove short words/stopwords
  const stopwords = new Set(['là', 'gì', 'cho', 'mình', 'của', 'và', 'hay', 'hoặc', 'thì', 'mà', 'để', 'có', 'không', 'được', 'với', 'từ', 'trong', 'này', 'đó', 'một', 'các', 'những', 'bạn', 'em', 'hãy', 'như', 'nào', 'sao', 'thế', 'bao', 'nhiêu'])
  const keywords = message
    .replace(/[?!.,;:]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopwords.has(w))

  if (keywords.length === 0) {
    // If no keywords extracted, use the whole message
    keywords.push(...message.split(/\s+/).filter(w => w.length > 1).slice(0, 5))
  }

  // Build a tsquery from keywords (OR logic for broader matches)
  const tsQuery = keywords.slice(0, 8).join(' | ')

  // --- Retrieve relevant QUESTIONS ---
  try {
    let questionsQuery = supabase
      .from('questions')
      .select('content, difficulty, node_id, subject_id')
      .eq('status', 'available') // Published/available questions only
      .limit(MAX_CONTEXT_QUESTIONS)

    if (subjectId) {
      questionsQuery = questionsQuery.eq('subject_id', subjectId)
    }

    const { data: questions } = await questionsQuery
      .order('created_at', { ascending: false })

    if (questions && questions.length > 0) {
      contextParts.push('📚 Câu hỏi trong bài học:')
      for (const q of questions as Array<{ content: Record<string, unknown>; difficulty: string }>) {
        contextParts.push(
          `- Câu hỏi: ${q.content.question || ''}` +
          `\n  Đáp án: ${(q.content.options as string[] || []).join(', ')}` +
          `\n  Giải thích: ${q.content.explanation || ''}` +
          `\n  Độ khó: ${q.difficulty || 'medium'}`
        )
      }
    }
  } catch (err) {
    console.error('Error retrieving questions:', err)
  }

  // --- Retrieve relevant DOCUMENTS ---
  try {
    let docsQuery = supabase
      .from('documents')
      .select('title, content')
      .limit(MAX_CONTEXT_DOCUMENTS)

    if (subjectId) {
      docsQuery = docsQuery.eq('subject_id', subjectId)
    }

    const { data: docs } = await docsQuery
      .order('created_at', { ascending: false })

    if (docs && docs.length > 0) {
      contextParts.push('\n📖 Tài liệu bài học:')
      for (const doc of docs as Array<{ title: string; content: string }>) {
        // Truncate long documents to ~2000 chars each
        const truncated = doc.content.length > 2000
          ? doc.content.substring(0, 2000) + '...'
          : doc.content
        contextParts.push(`--- ${doc.title} ---\n${truncated}`)
      }
    }
  } catch (err) {
    console.error('Error retrieving documents:', err)
  }

  if (contextParts.length === 0) {
    return 'Chưa có tài liệu bài học nào được cung cấp. Hãy từ chối trả lời và gợi ý học sinh hỏi thầy/cô giáo.'
  }

  return contextParts.join('\n')
}

/**
 * Hash a message string for cache lookup
 * Using a simple hash since we're in an edge runtime environment
 */
async function hashMessage(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Save user message and AI response to chat_logs
 */
async function saveChatLogs(
  supabase: SupabaseClient,
  userId: string,
  userMessage: string,
  aiResponse: string,
  subjectId?: number | null
) {
  const conversationId = `conv_${userId}_${new Date().toISOString().split('T')[0]}`

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('chat_logs') as any).insert([
      {
        user_id: userId,
        sender: 'user',
        message: userMessage,
        conversation_id: conversationId,
        subject_id: subjectId || null,
      },
      {
        user_id: userId,
        sender: 'ai',
        message: aiResponse,
        conversation_id: conversationId,
        subject_id: subjectId || null,
      },
    ])
  } catch (err) {
    console.error('Error saving chat logs:', err)
  }
}

/**
 * Cache the AI response for future identical questions
 */
async function saveToCache(
  supabase: SupabaseClient,
  cacheKey: string,
  originalMessage: string,
  response: string,
  subjectId?: number | null
) {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('chat_cache') as any).upsert({
      question_hash: cacheKey,
      subject_id: subjectId || null,
      original_message: originalMessage,
      response: response,
      hit_count: 0,
      expires_at: expiresAt,
    }, {
      onConflict: 'question_hash',
    })
  } catch (err) {
    console.error('Error saving to cache:', err)
  }
}
