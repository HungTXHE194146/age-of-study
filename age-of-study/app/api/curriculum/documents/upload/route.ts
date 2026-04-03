import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractTextFromFile } from '@/lib/fileParser'
import { processWithGemini, insertDocumentToDb } from '../gemini-utils'

// --- Server-side Supabase client ---
function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifyAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user: authUser } } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  ).auth.getUser(token)

  if (!authUser) return null

  const supabase = getServerSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!profile || (profile.role !== 'system_admin' && profile.role !== 'teacher')) return null
  return { userId: authUser.id, role: profile.role }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthorized(request)
    if (!auth) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })

    // Parse multiform data
    const body = await request.json()
    const { fileName, fileType, fileContent, subjectId, metadata } = body

    if (!fileContent || !subjectId) {
      return NextResponse.json({ error: 'Thiếu thông tin file hoặc môn học' }, { status: 400 })
    }

    // Convert base64 back to Buffer
    const buffer = Buffer.from(fileContent, 'base64')

    // 1. Extract text from file
    const parsed = await extractTextFromFile(buffer, fileType, fileName)
    if (parsed.error || !parsed.text) {
      return NextResponse.json({ error: parsed.error || 'Không thể trích xuất văn bản từ file' }, { status: 400 })
    }

    // 2. Process with Gemini
    const extracted = await processWithGemini(parsed.text)

    // 3. Save to DB
    const supabase = getServerSupabase()
    const result = await insertDocumentToDb(supabase, {
      title: metadata?.title || fileName,
      fileName,
      fileType,
      content: parsed.text,
      subjectId: parseInt(subjectId),
      teacherId: auth.role === 'teacher' ? auth.userId : null,
      extracted
    })

    return NextResponse.json({
      success: true,
      document: {
        id: result.documentId,
        title: metadata?.title || extracted.lesson.title,
        fileName,
        totalPages: 1, // Assuming 1 for simple uploads
        contentLength: parsed.text.length,
        chunksCreated: result.totalChunks
      },
      message: 'Tài liệu đã được tải lên và xử lý thành công'
    })

  } catch (error) {
    console.error('POST /api/curriculum/documents/upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi hệ thống khi tải tài liệu' },
      { status: 500 }
    )
  }
}
