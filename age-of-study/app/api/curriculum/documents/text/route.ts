import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

    const body = await request.json()
    const { title, content, subjectId } = body

    if (!content || !subjectId) {
      return NextResponse.json({ error: 'Thiếu nội dung hoặc môn học' }, { status: 400 })
    }

    // 1. Process with Gemini
    const extracted = await processWithGemini(content)

    // 2. Save to DB
    const supabase = getServerSupabase()
    const result = await insertDocumentToDb(supabase, {
      title: title || extracted.lesson.title,
      fileName: 'text-input.txt',
      fileType: 'text/plain',
      content: content,
      subjectId: parseInt(subjectId),
      teacherId: auth.role === 'teacher' ? auth.userId : null,
      extracted
    })

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      message: 'Nội dung đã được xử lý và lưu thành công'
    })

  } catch (error) {
    console.error('POST /api/curriculum/documents/text error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}
