import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/adminAuth";
import { randomInt } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is an admin
    const authResult = await verifyAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUserId = authResult.userId;

    const { teacher_id } = await request.json();

    if (!teacher_id) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc." },
        { status: 400 }
      );
    }

    // Verify the teacher exists and has the teacher role
    const { data: teacherProfile, error: teacherError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username")
      .eq("id", teacher_id)
      .eq("role", "teacher")
      .single();

    if (teacherError || !teacherProfile) {
      return NextResponse.json(
        { error: "Không tìm thấy giáo viên." },
        { status: 404 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store the code (reusing magic_login_codes table, student_id holds teacher_id here)
    const { error: insertError } = await supabaseAdmin
      .from("magic_login_codes")
      .insert({
        student_id: teacher_id,
        code,
        created_by: adminUserId,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Insert teacher magic code error:", insertError);
      return NextResponse.json(
        { error: "Không thể tạo mã. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    // Flag teacher to change password on next login
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", teacher_id);

    if (updateError) {
      console.error("Failed to set must_change_password flag:", updateError);
    }

    return NextResponse.json({ code, expires_in_minutes: 5 });
  } catch (err) {
    console.error("Teacher magic login generate error:", err);
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
