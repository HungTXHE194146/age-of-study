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
        maxOutputTokens: 1500,  // Increased: thinking model needs more budget
        temperature: 0.7,
        // @ts-expect-error thinkingConfig not yet in type definitions but supported by API
        thinkingConfig: { thinkingBudget: 256 },  // Cap thinking tokens, save budget for response
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
// DELETE /api/chat — Clear today's chat history (service role bypasses RLS)
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify JWT using anon client
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: { user: authUser }, error: authError } = await anonClient.auth.getUser(token)

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Phiên đăng nhập hết hạn' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    const conversationId = `conv_${authUser.id}_${today}`

    // Service role client bypasses RLS
    const supabase = getServerSupabase()
    const { error } = await supabase
      .from('chat_logs')
      .delete()
      .eq('user_id', authUser.id)
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('Error clearing chat history:', error)
      return NextResponse.json({ error: 'Không thể xóa lịch sử' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear chat history error:', error)
    return NextResponse.json({ error: 'Có lỗi xảy ra' }, { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Retrieve relevant context from lesson_sections table
 * Uses PostgreSQL FTS + JSONB search to find matching content and Q&A pairs
 */
async function retrieveContext(
  supabase: SupabaseClient,
  message: string,
  subjectId?: number | null
): Promise<string> {
  const contextParts: string[] = []

  // Extract search keywords from the message
  // Note: Don't include "từ" in stopwords because it's part of compound words like "đại từ", "động từ"
  const stopwords = new Set(['là', 'gì', 'cho', 'mình', 'của', 'và', 'hay', 'hoặc', 'thì', 'mà', 'để', 'có', 'không', 'được', 'với', 'trong', 'này', 'đó', 'một', 'các', 'những', 'bạn', 'em', 'hãy', 'như', 'nào', 'sao', 'thế', 'bao', 'nhiêu', 'vậy', 'nhỉ', 'à', 'ạ', 'ơi', 'nha', 'nhé', 'đi', 'đâu', 'rồi', 'chưa'])
  
  // Clean message
  const cleanedMessage = message.replace(/[?!.,;:]/g, '').toLowerCase()
  
  // Extract keywords
  const keywords = cleanedMessage
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopwords.has(w))

  if (keywords.length === 0) {
    keywords.push(...cleanedMessage.split(/\s+/).filter(w => w.length > 1).slice(0, 5))
  }
  
  // Build search terms: 
  // 1. Join keywords as phrase (e.g., "đại từ" from ["đại", "từ"])
  // 2. Individual keywords for broader matching
  const searchTerms: string[] = []
  
  // Add keywords joined as phrase (e.g., "đại từ động từ")
  if (keywords.length > 0) {
    const keywordsPhrase = keywords.slice(0, 3).join(' ')  // Max 3 words
    if (keywordsPhrase.length > 2) {
      searchTerms.push(keywordsPhrase)
    }
  }
  
  // Add individual keywords
  searchTerms.push(...keywords.slice(0, 5))

  // Build search query
  const searchTerm = keywords.slice(0, 5).join(' ')
  
  // Debug logging (gated by environment variable to avoid PII leaks)
  const DEBUG = process.env.DEBUG === 'true'
  if (DEBUG) {
    console.log('[CHAT-API] Original message:', message?.substring(0, 100))
    console.log('[CHAT-API] Extracted keywords:', keywords)
    console.log('[CHAT-API] Search terms:', searchTerms)
  }

  // --- Retrieve relevant LESSON SECTIONS with Q&A pairs ---
  try {
    // Get node_ids for the subject first
    let nodeIds: number[] = []
    if (subjectId) {
      const { data: nodes } = await supabase
        .from('nodes')
        .select('id')
        .eq('subject_id', subjectId)
      
      nodeIds = (nodes || []).map((n: { id: number }) => n.id)
      if (DEBUG) console.log(`[CHAT-API] Subject ID: ${subjectId}, Found ${nodeIds.length} nodes`)
    } else {
      if (DEBUG) console.log('[CHAT-API] No subject ID provided, searching all subjects')
    }

    // Query lesson_sections with ILIKE search on both title and content
    // Search each term (phrase or keyword) for better matching
    let sectionsQuery = supabase
      .from('lesson_sections')
      .select(`
        id,
        title,
        content,
        qa_pairs,
        remember,
        section_type,
        node_id,
        nodes!inner(title, subject_id)
      `)
    
    // Sanitize search terms to prevent PostgREST filter injection
    const escapeLike = (term: string) => {
      return term
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/%/g, '\\%')      // Escape % wildcard
        .replace(/_/g, '\\_')      // Escape _ wildcard
        .replace(/["()]/g, '')     // Remove PostgREST control chars
    }
    
    // Build OR condition for each search term in title or content
    const orConditions = searchTerms.map(term => {
      const escaped = escapeLike(term)
      return `title.ilike.%${escaped}%,content.ilike.%${escaped}%`
    }).join(',')
    
    if (orConditions) {
      sectionsQuery = sectionsQuery.or(orConditions)
    }

    if (nodeIds.length > 0) {
      sectionsQuery = sectionsQuery.in('node_id', nodeIds)
    }

    // Order by relevance: prioritize exact phrase matches in title
    // Note: Supabase doesn't support complex ORDER BY expressions, so we'll sort in JS
    sectionsQuery = sectionsQuery.limit(20)  // Get more results to sort

    const { data: sectionsRaw, error: sectionsError } = await sectionsQuery
    
    if (sectionsError) {
      console.error('Error querying lesson_sections:', sectionsError)
    }

    // Sort results by relevance in JavaScript
    const sections = sectionsRaw?.sort((a, b) => {
      const aTitle = (a.title ?? '').toLowerCase()
      const bTitle = (b.title ?? '').toLowerCase()
      const aContent = (a.content ?? '').toLowerCase()
      const bContent = (b.content ?? '').toLowerCase()
      
      // Priority 1: Exact phrase match in title
      const firstTerm = searchTerms[0]?.toLowerCase() || ''
      const aExactTitle = aTitle.includes(firstTerm) ? 1 : 0
      const bExactTitle = bTitle.includes(firstTerm) ? 1 : 0
      if (aExactTitle !== bExactTitle) return bExactTitle - aExactTitle
      
      // Priority 2: Any match in title
      const aTitleMatch = searchTerms.some(t => aTitle.includes(t.toLowerCase())) ? 1 : 0
      const bTitleMatch = searchTerms.some(t => bTitle.includes(t.toLowerCase())) ? 1 : 0
      if (aTitleMatch !== bTitleMatch) return bTitleMatch - aTitleMatch
      
      // Priority 3: Content match
      const aContentMatch = searchTerms.some(t => aContent.includes(t.toLowerCase())) ? 1 : 0
      const bContentMatch = searchTerms.some(t => bContent.includes(t.toLowerCase())) ? 1 : 0
      return bContentMatch - aContentMatch
    }).slice(0, MAX_CONTEXT_DOCUMENTS)  // Take top 5 after sorting

    if (DEBUG) {
      console.log(`[DEBUG] Search terms: ${searchTerms.join(', ')}`)
      console.log(`[DEBUG] Found ${sections?.length || 0} sections`)
    }

    if (sections && sections.length > 0) {
      contextParts.push('📖 Kiến thức bài học:')
      
      for (const section of sections as Array<{
        title: string
        content: string
        qa_pairs: Array<{ question: string; answer: string }>
        remember: string | null
        section_type: string
        nodes: { title: string; subject_id: number } | Array<{ title: string; subject_id: number }>
      }>) {
        // Handle both single object and array from Supabase
        const nodeTitle = Array.isArray(section.nodes) 
          ? section.nodes[0]?.title 
          : section.nodes?.title || 'Bài học'
        if (DEBUG) console.log(`[DEBUG] Section: ${section.title} (Node: ${nodeTitle})`)
        
        // Add main content
        if (section.content && section.content.length > 0) {
          const truncated = section.content.length > 1500
            ? section.content.substring(0, 1500) + '...'
            : section.content
          contextParts.push(`\n📝 ${nodeTitle} - ${section.title}:\n${truncated}`)
        }

        // Add Q&A pairs if available
        if (section.qa_pairs && section.qa_pairs.length > 0) {
          contextParts.push('\n💡 Câu hỏi & Đáp án mẫu:')
          for (const qa of section.qa_pairs.slice(0, 3)) {
            contextParts.push(
              `Q: ${qa.question.substring(0, 200)}${qa.question.length > 200 ? '...' : ''}` +
              `\nA: ${qa.answer.substring(0, 300)}${qa.answer.length > 300 ? '...' : ''}`
            )
          }
        }

        // Add remember section if available
        if (section.remember) {
          const rememberTrunc = section.remember.length > 500
            ? section.remember.substring(0, 500) + '...'
            : section.remember
          contextParts.push(`\n🎯 Ghi nhớ:\n${rememberTrunc}`)
        }
      }
    }

    // Reuse already-fetched sections for Q&A pairs to avoid duplicate queries
    // Filter sections that have relevant qa_pairs
    const qaMatches = sections?.filter(section => {
      if (!section.qa_pairs || section.qa_pairs.length === 0) return false
      const qaStr = JSON.stringify(section.qa_pairs).toLowerCase()
      return searchTerms.some(term => qaStr.includes(term.toLowerCase()))
    }).slice(0, 5) || []

    if (DEBUG) console.log(`[DEBUG] Found ${qaMatches?.length || 0} Q&A matches`)

    if (qaMatches && qaMatches.length > 0) {
      for (const match of qaMatches) {
        // Handle both single object and array from Supabase
        const nodeTitle = Array.isArray(match.nodes)
          ? match.nodes[0]?.title || 'Bài học'
          : (match.nodes as any)?.title || 'Bài học'
        if (match.qa_pairs && match.qa_pairs.length > 0) {
          // Find matching Q&A pairs
          const relevantQA = match.qa_pairs.filter((qa: any) => 
            searchTerms.some(term => 
              qa.question.toLowerCase().includes(term.toLowerCase()) ||
              qa.answer.toLowerCase().includes(term.toLowerCase())
            )
          )
          
          if (relevantQA.length > 0) {
            contextParts.push(`\n📚 ${nodeTitle} - Câu hỏi liên quan:`)
            for (const qa of relevantQA.slice(0, 2)) {
              contextParts.push(`Q: ${qa.question}\nA: ${qa.answer}`)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error retrieving lesson sections:', err)
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
