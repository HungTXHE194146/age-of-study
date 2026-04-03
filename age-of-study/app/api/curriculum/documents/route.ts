import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// --- Server-side Supabase client (bypasses RLS for admin operations) ---
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
// GET /api/curriculum/documents — List documents for a subject
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuthorized(request)
    if (authResult instanceof NextResponse) return authResult
    const { userId, role } = authResult

    // Parse query params
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const nodeId = searchParams.get('nodeId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!subjectId) {
      return NextResponse.json({ error: 'Thiếu subjectId' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Build base query
    let query = supabase
      .from('documents')
      .select('*, document_chunks(count)', { count: 'exact' })
      .eq('subject_id', parseInt(subjectId))

    // Teachers can only see their own documents or system documents (null teacher_id)
    // Admin can see everything
    if (role === 'teacher') {
      query = query.or(`teacher_id.is.null,teacher_id.eq.${userId}`)
    }

    // Optional node filtering
    if (nodeId) {
      // Find documents that have chunks mapped to this node
      // Note: This requires a join with document_chunks
      // For now, simpler filtering or implement node-specific listing if needed
    }

    // Apply pagination
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error listing documents:', error)
      return NextResponse.json({ error: 'Lỗi truy vấn cơ sở dữ liệu' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      documents: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      }
    })

  } catch (error) {
    console.error('GET /api/curriculum/documents error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}
