import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuditLog } from "@/lib/auditService";
import { verifyAdmin } from "@/lib/adminAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * POST /api/admin/users/block
 * Block or unblock a user
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUserId = authResult.userId;

    const body = await request.json();
    const { userId, block } = body;

    if (!userId || typeof block !== 'boolean') {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc (userId, block)" },
        { status: 400 }
      );
    }

    // Get old user data first
    const { data: oldUser, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("username, full_name, email, is_blocked, role")
      .eq("id", userId)
      .single();

    if (fetchError || !oldUser) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    // Update block status
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ is_blocked: block })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: `Lỗi cập nhật trạng thái: ${updateError.message}` },
        { status: 500 }
      );
    }

    // ✅ AUDIT LOG
    await createAuditLog(adminUserId, {
      action: block ? 'user_blocked' : 'user_unblocked',
      resourceType: 'user',
      resourceId: userId,
      description: `${block ? 'Chặn' : 'Mở chặn'} người dùng: ${oldUser.full_name || oldUser.username} (${oldUser.role})`,
      oldValues: { is_blocked: oldUser.is_blocked },
      newValues: { is_blocked: block },
      metadata: {
        username: oldUser.username,
        email: oldUser.email,
        role: oldUser.role
      }
    }, request);

    return NextResponse.json({
      success: true,
      message: block ? "Đã chặn người dùng" : "Đã mở chặn người dùng",
    });

  } catch (error: any) {
    console.error("Error blocking/unblocking user:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}
