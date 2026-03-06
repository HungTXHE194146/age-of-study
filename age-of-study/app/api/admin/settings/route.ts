import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SETTINGS_CONSTRAINTS } from '@/types/settings'
import type { SystemSettingsUpdate } from '@/types/settings'
import { createAuditLog } from '@/lib/auditService'

// --- Server-side Supabase client (bypasses RLS) ---
function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Verify the caller is an authenticated system_admin.
 * Returns { userId } on success, or a NextResponse error.
 */
async function verifyAdmin(request: NextRequest): Promise<
  { userId: string } | NextResponse
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

  if (profileError) {
    console.error('Failed to fetch user profile:', profileError)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }

  if (!profile || profile.role !== 'system_admin') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
  }

  return { userId: authUser.id }
}

// ============================================================================
// GET /api/admin/settings — Read system settings
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (authResult instanceof NextResponse) return authResult

    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Failed to read system_settings:', error)
      return NextResponse.json(
        { error: 'Không thể tải cài đặt hệ thống' },
        { status: 500 }
      )
    }

    // Also fetch the updater's name for display
    let updatedByName: string | null = null
    if (data.updated_by) {
      const { data: updater } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', data.updated_by)
        .single()

      if (updater) {
        updatedByName = updater.full_name || updater.username || null
      }
    }

    return NextResponse.json({ data, updatedByName })
  } catch (error) {
    console.error('GET /api/admin/settings error:', error)
    return NextResponse.json(
      { error: 'Lỗi server. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/admin/settings — Update system settings
// ============================================================================
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const body: SystemSettingsUpdate = await request.json()

    // --- Validate each field ---
    const errors: string[] = []

    if (body.school_name !== undefined) {
      if (typeof body.school_name !== 'string' || body.school_name.trim().length === 0) {
        errors.push('Tên trường không được để trống')
      } else if (body.school_name.length > 200) {
        errors.push('Tên trường quá dài (tối đa 200 ký tự)')
      }
    }

    if (body.school_year !== undefined) {
      if (typeof body.school_year !== 'string' || body.school_year.trim().length === 0) {
        errors.push('Năm học không được để trống')
      } else if (!/^\d{4}-\d{4}$/.test(body.school_year.trim())) {
        errors.push('Năm học phải có dạng "2025-2026"')
      }
    }

    if (body.ai_chat_banned_words !== undefined) {
      if (typeof body.ai_chat_banned_words !== 'string') {
        errors.push('Danh từ cấm phải là một văn bản')
      } else if (body.ai_chat_banned_words.length > 2000) {
        errors.push('Danh sách từ cấm quá dài (tối đa 2000 ký tự)')
      }
    }

    // Validate numeric fields using constraints
    const numericFields = [
      'default_daily_limit_minutes',
      'ai_chat_temperature',
      'ai_chat_max_tokens',
      'ai_chat_rate_limit_per_minute',
      'ai_question_temperature',
      'ai_question_max_tokens',
    ] as const

    for (const field of numericFields) {
      const value = body[field]
      if (value !== undefined) {
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${field} phải là số hợp lệ`)
          continue
        }
        const constraint = SETTINGS_CONSTRAINTS[field]
        if (value < constraint.min || value > constraint.max) {
          errors.push(`${field} phải trong khoảng ${constraint.min}–${constraint.max}`)
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }

    // --- Build clean update payload (only allowed fields) ---
    const allowedFields = [
      'school_name', 'school_year', 'default_daily_limit_minutes',
      'ai_chat_temperature', 'ai_chat_max_tokens', 'ai_chat_rate_limit_per_minute', 'ai_chat_banned_words',
      'ai_question_temperature', 'ai_question_max_tokens',
    ] as const

    const updatePayload: Record<string, unknown> = { updated_by: userId }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = field === 'school_name' || field === 'school_year' || field === 'ai_chat_banned_words'
          ? (body[field] as string).trim()
          : body[field]
      }
    }

    // --- Get old values for audit log ---
    const supabase = getServerSupabase()
    const { data: oldSettings } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single()

    // --- Execute update ---
    const { data, error } = await supabase
      .from('system_settings')
      .update(updatePayload)
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('Failed to update system_settings:', error)
      return NextResponse.json(
        { error: 'Không thể lưu cài đặt. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    // ✅ AUDIT LOG
    await createAuditLog(userId, {
      action: 'system_settings_changed',
      resourceType: 'system_settings',
      resourceId: '1',
      description: `Cập nhật cài đặt hệ thống: ${Object.keys(body).join(', ')}`,
      oldValues: oldSettings || undefined,
      newValues: updatePayload,
      metadata: {
        fields_changed: Object.keys(body)
      }
    }, request)

    return NextResponse.json({ data, message: 'Cài đặt đã được lưu thành công' })
  } catch (error) {
    console.error('PUT /api/admin/settings error:', error)
    return NextResponse.json(
      { error: 'Lỗi server. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
