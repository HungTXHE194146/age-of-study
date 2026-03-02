import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { SystemSettings, SystemSettingsUpdate } from '@/types/settings'

/**
 * Fetch system settings from the single-row system_settings table.
 * Uses browser client (respects RLS — any authenticated user can read).
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('Failed to load system settings:', error)
    throw new Error('Không thể tải cài đặt hệ thống')
  }

  return data as SystemSettings
}

/**
 * Update system settings via the server-side API route.
 * The API verifies system_admin role and validates inputs.
 */
export async function updateSystemSettings(
  updates: SystemSettingsUpdate
): Promise<SystemSettings> {
  const supabase = getSupabaseBrowserClient()

  // Get current session token for auth
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
  }

  const response = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Lỗi ${response.status}: Không thể lưu cài đặt`)
  }

  const result = await response.json()
  return result.data as SystemSettings
}
