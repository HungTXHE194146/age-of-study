import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { student_id, teacher_id } = await request.json();

    if (!student_id || !teacher_id) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc." },
        { status: 400 }
      );
    }

    // Verify the requester is a teacher
    const { data: teacherProfile, error: teacherError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", teacher_id)
      .single();

    if (teacherError || !teacherProfile || teacherProfile.role !== "teacher") {
      return NextResponse.json(
        { error: "Không có quyền thực hiện thao tác này." },
        { status: 403 }
      );
    }

    // Verify the student exists
    const { data: studentProfile, error: studentError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username")
      .eq("id", student_id)
      .eq("role", "student")
      .single();

    if (studentError || !studentProfile) {
      return NextResponse.json(
        { error: "Không tìm thấy học sinh." },
        { status: 404 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store the code
    const { error: insertError } = await supabaseAdmin
      .from("magic_login_codes")
      .insert({
        student_id,
        code,
        created_by: teacher_id,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Insert magic code error:", insertError);
      return NextResponse.json(
        { error: "Không thể tạo mã. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    // Flag student to change password on next login
    await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", student_id);

    return NextResponse.json({ code, expires_in_minutes: 5 });
  } catch (err) {
    console.error("Magic login generate error:", err);
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
