import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { AuditAction } from '@/types/audit';

// Server-side Supabase client with service role
function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Get authenticated user from cookies
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  
  // Get Supabase auth tokens from cookies
  // Supabase stores tokens in cookies named: sb-<project-ref>-auth-token
  const allCookies = cookieStore.getAll();
  const authCookie = allCookies.find(c => c.name.includes('auth-token'));
  
  if (!authCookie) {
    return null;
  }

  try {
    const tokenData = JSON.parse(authCookie.value);
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return null;
    }

    // Verify token with anon client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error parsing auth cookie:', error);
    return null;
  }
}

// Verify admin role
async function verifyAdmin(): Promise<{ userId: string } | NextResponse> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  // Check role with service client
  const supabase = getServerSupabase();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }

  if (!profile || profile.role !== 'system_admin') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
  }

  return { userId: user.id };
}

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin
    const authResult = await verifyAdmin();
    if (authResult instanceof NextResponse) return authResult;

    const supabase = getServerSupabase();

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') as AuditAction | null;
    const actorId = searchParams.get('actorId');
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 50 : Math.min(limitParam, 1000);
    const offset = Number.isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (action) query = query.eq('action', action);
    if (actorId) query = query.eq('actor_id', actorId);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (resourceId) query = query.eq('resource_id', resourceId);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Không thể tải audit logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error in GET /api/admin/audit-logs:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
