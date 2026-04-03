import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTeacher } from "@/lib/adminAuth";

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
    // Authenticate teacher from token — do NOT trust teacher_id from body
    const authResult = await verifyTeacher(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const teacherId = authResult.userId;

    const { student_id } = await request.json();

    if (!student_id) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc." },
        { status: 400 }
      );
    }

    // Verify student belongs to a class taught by this teacher (resource-level scope)
    const { data: teacherClasses } = await supabaseAdmin
      .from("class_teachers")
      .select("class_id")
      .eq("teacher_id", teacherId);

    const classIds = teacherClasses?.map((c) => c.class_id) || [];

    const { data: isAssociated, error: scopeError } = await supabaseAdmin
      .from("class_students")
      .select("class_id")
      .eq("student_id", student_id)
      .in("class_id", classIds)
      .limit(1)
      .single();

    if (scopeError || !isAssociated) {
      return NextResponse.json(
        { error: "Bạn không có quyền tạo mã cho học sinh này. (Unauthorized for this student scope)" },
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

    // Store the code — use verified teacherId, not one from body
    const { error: insertError } = await supabaseAdmin
      .from("magic_login_codes")
      .insert({
        student_id,
        code,
        created_by: teacherId,
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

