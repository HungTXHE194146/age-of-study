import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with service role key (bypasses RLS)
 */
function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Verify that the request is from an authenticated system admin
 * Returns userId on success, or NextResponse error on failure
 */
export async function verifyAdmin(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = getServerSupabase();

  // Verify JWT
  const {
    data: { user: authUser },
    error: authError,
  } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  ).auth.getUser(token);

  if (authError || !authUser) {
    return NextResponse.json(
      { error: 'Phiên đăng nhập hết hạn' },
      { status: 401 }
    );
  }

  // Check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (profileError) {
    console.error('Failed to fetch user profile:', profileError);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }

  if (!profile || profile.role !== 'system_admin') {
    return NextResponse.json(
      { error: 'Không có quyền truy cập' },
      { status: 403 }
    );
  }

  return { userId: authUser.id };
}

/**
 * Verify that the request is from an authenticated teacher
 * Returns userId on success, or NextResponse error on failure
 */
export async function verifyTeacher(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = getServerSupabase();

  // Verify JWT
  const {
    data: { user: authUser },
    error: authError,
  } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  ).auth.getUser(token);

  if (authError || !authUser) {
    return NextResponse.json(
      { error: 'Phiên đăng nhập hết hạn' },
      { status: 401 }
    );
  }

  // Check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (profileError) {
    console.error('Failed to fetch user profile:', profileError);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }

  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Không có quyền truy cập' },
      { status: 403 }
    );
  }

  return { userId: authUser.id };
}
