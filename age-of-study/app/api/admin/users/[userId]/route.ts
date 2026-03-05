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
 * DELETE /api/admin/users/[userId]
 * Delete a user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUserId = authResult.userId;

    const userId = (await params).userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Thiếu user ID" },
        { status: 400 }
      );
    }

    // Get user data before deletion for audit log
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("username, full_name, email, role, total_xp, created_at")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    // Delete from auth (CASCADE will handle profile and related data)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Lỗi xóa người dùng: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // ✅ AUDIT LOG
    await createAuditLog(adminUserId, {
      action: 'user_deleted',
      resourceType: 'user',
      resourceId: userId,
      description: `Xóa người dùng: ${user.full_name || user.username} (${user.role})`,
      oldValues: {
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        total_xp: user.total_xp,
        created_at: user.created_at
      },
      metadata: {
        permanent_deletion: true
      }
    }, request);

    return NextResponse.json({
      success: true,
      message: "Đã xóa người dùng thành công",
    });

  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}
