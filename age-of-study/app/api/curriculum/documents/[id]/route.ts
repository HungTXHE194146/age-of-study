import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// --- Server-side Supabase client (bypasses RLS) ---
function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Verify the caller is an authenticated teacher or system_admin.
 */
async function verifyAuthorized(request: NextRequest): Promise<
  { userId: string; role: string } | NextResponse
> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = getServerSupabase()

  // Verify JWT
  const { data: { user: authUser }, error: authError } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  ).auth.getUser(token)

  if (authError || !authUser) {
    return NextResponse.json({ error: 'Phiên đăng nhập hết hạn' }, { status: 401 })
  }

  // Check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Không thể xác thực quyền hạn' }, { status: 403 })
  }

  if (profile.role !== 'system_admin' && profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
  }

  return { userId: authUser.id, role: profile.role }
}

// ============================================================================
// GET /api/curriculum/documents/[id] — Get document detail with chunks
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuthorized(request)
    if (authResult instanceof NextResponse) return authResult
    const { userId, role } = authResult
    const { id: documentId } = await params

    const supabase = getServerSupabase()

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*, subjects(name, code, grade_level)')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 })
    }

    // Permission check for teachers
    if (role === 'teacher' && document.teacher_id && document.teacher_id !== userId) {
      return NextResponse.json({ error: 'Bạn không có quyền xem tài liệu này' }, { status: 403 })
    }

    // Fetch chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*, nodes(title, node_type, content_label)')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })

    if (chunksError) {
      console.error('Error fetching document chunks:', chunksError)
      return NextResponse.json({ error: 'Lỗi tải chi tiết tài liệu' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document,
      chunks: chunks || [],
      totalChunks: chunks?.length || 0
    })

  } catch (error) {
    console.error('GET /api/curriculum/documents/[id] error:', error)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/curriculum/documents/[id] — Delete document
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuthorized(request)
    if (authResult instanceof NextResponse) return authResult
    const { userId, role } = authResult
    const { id: documentId } = await params

    const supabase = getServerSupabase()

    // 1. Ownership check
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('teacher_id')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 })
    }

    if (role === 'teacher' && document.teacher_id !== userId) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa tài liệu này' }, { status: 403 })
    }

    // 2. Delete (cascading cleanup of chunks and sections handled by DB)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      return NextResponse.json({ error: 'Không thể xóa tài liệu' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Đã xóa tài liệu thành công' })

  } catch (error) {
    console.error('DELETE /api/curriculum/documents/[id] error:', error)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
