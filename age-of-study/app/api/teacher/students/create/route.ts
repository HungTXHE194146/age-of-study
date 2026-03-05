import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuditLog } from "@/lib/auditService";
import { verifyTeacher } from "@/lib/adminAuth";

// Init Supabase Client with Service Role Key to bypass RLS and create users directly
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

export async function POST(request: NextRequest) {
  try {
    // Verify teacher authentication
    const authResult = await verifyTeacher(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    const teacherId = authResult.userId;

    const body = await request.json();
    const { full_name, username, class_id, dob, gender, ethnicity, phone_number, enroll_status, sessions_per_week } = body;

    if (!full_name || !username || !class_id) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc (full_name, username, class_id)" },
        { status: 400 }
      );
    }

    // 1. Create Auth User using Admin API
    // We use a dummy email because Supabase Auth requires an email.
    // Students will login via username/password custom logic.
    const dummyEmail = `${username.toLowerCase().trim()}@ageofstudy.local`;
    const defaultPassword = "12345678";

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dummyEmail,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        username: username.toLowerCase().trim(),
        full_name,
        role: "student",
      },
    });

    if (authError) {
      console.error("Auth User Creation Error:", authError);
      return NextResponse.json(
        { error: `Lỗi tạo tài khoản Auth: ${authError.message}` },
        { status: 500 }
      );
    }

    const userId = authUser.user.id;

    // 2. Add to Profiles Table
    // The trigger might have auto-created the profile, so we use upsert
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        username: username.toLowerCase().trim(),
        full_name,
        role: "student",
        dob: dob || null,
        gender: gender || null,
        ethnicity: ethnicity || null,
        phone_number: phone_number || null,
        enroll_status: enroll_status || null,
        sessions_per_week: sessions_per_week || null
      }, { onConflict: 'id' });

    if (profileError) {
      console.error("Profile Creation Error:", profileError);
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Lỗi tạo Profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 3. Attach student to the class
    const { error: classError } = await supabaseAdmin
      .from("class_students")
      .insert({
        class_id: class_id,
        student_id: userId,
        status: "active",
      });

    if (classError) {
      console.error("Class Attachment Error:", classError);
      // We don't rollback the user here, just return the error.
      // The user is created but not in class.
      return NextResponse.json(
        { error: `Lỗi xếp lớp: ${classError.message}` },
        { status: 500 }
      );
    }

    // ✅ AUDIT LOG
    try {
      await createAuditLog(teacherId, {
        action: 'user_created',
        resourceType: 'user',
        resourceId: userId,
        description: `Tạo tài khoản học sinh: ${full_name} (@${username})`,
        newValues: {
          username,
          full_name,
          role: 'student',
          class_id
        },
        metadata: {
          // PII removed for compliance
        }
      }, request);
    } catch (auditError) {
      console.error("Audit Log Creation Error:", { teacherId, userId, username, error: auditError });
    }

    return NextResponse.json({
      success: true,
      message: "Tạo tài khoản học sinh thành công",
      user: {
        id: userId,
        username,
        full_name,
      },
    });
  } catch (error: any) {
    console.error("Unknown Error Creating Student:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tạo học sinh" },
      { status: 500 }
    );
  }
}
