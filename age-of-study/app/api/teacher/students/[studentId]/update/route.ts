import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuditLog } from "@/lib/auditService";
import { verifyTeacher } from "@/lib/adminAuth";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    // Verify teacher authentication
    const authResult = await verifyTeacher(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    const teacherId = authResult.userId;

    const studentId = (await params).studentId;
    const body = await request.json();
    const { 
      full_name, 
      username, 
      dob, 
      gender, 
      ethnicity, 
      phone_number, 
      enroll_status, 
      sessions_per_week 
    } = body;

    if (!studentId || !full_name || !username) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc (studentId, full_name, username)" },
        { status: 400 }
      );
    }

    const cleanUsername = username.toString().toLowerCase().trim();

    // Get old values for audit log
    const { data: oldData } = await supabaseAdmin
      .from("profiles")
      .select("username, full_name, dob, gender, ethnicity, phone_number, enroll_status, sessions_per_week")
      .eq('id', studentId)
      .single();

    if (!oldData) {
      return NextResponse.json(
        { error: "Không tìm thấy học sinh" },
        { status: 404 }
      );
    }
    // Update Auth Identity (if we need to update email, we use update user. For now, just metadata)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(studentId, {
      user_metadata: {
        username: cleanUsername,
        full_name,
      }
    });

    if (authError) {
      return NextResponse.json(
        { error: `Lỗi cập nhật tài khoản: ${authError.message}` },
        { status: 500 }
      );
    }

    // Update Profile Table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        username: cleanUsername,
        full_name,
        dob: dob || null,
        gender: gender || null,
        ethnicity: ethnicity || null,
        phone_number: phone_number || null,
        enroll_status: enroll_status || null,
        sessions_per_week: sessions_per_week || null
      })
      .eq('id', studentId);

    if (profileError) {
      return NextResponse.json(
        { error: `Lỗi cập nhật hồ sơ: ${profileError.message}` },
        { status: 500 }
      );
    }

    // ✅ AUDIT LOG
    try {
      await createAuditLog(teacherId, {
        action: 'user_updated',
        resourceType: 'user',
        resourceId: studentId,
        description: `Cập nhật thông tin học sinh: ${full_name} (@${cleanUsername})`,
        oldValues: oldData || undefined,
        newValues: {
          username: cleanUsername,
          full_name,
          dob,
          gender,
          ethnicity,
          phone_number,
          enroll_status,
          sessions_per_week
        }
      }, request);
    } catch (auditError) {
      console.error("Audit log failed:", auditError);
      // Continue - don't fail the request due to audit logging
    }
    return NextResponse.json({
      success: true,
      message: "Cập nhật học sinh thành công",
    });

  } catch (error: any) {
    console.error("Unknown Error Updating Student:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi cập nhật học sinh" },
      { status: 500 }
    );
  }
}
