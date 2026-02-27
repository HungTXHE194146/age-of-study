import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const body = await request.json();
    const { students, class_id } = body;

    // students should be an array of { full_name, username }
    if (!students || !Array.isArray(students) || students.length === 0 || !class_id) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ. Cần danh sách học sinh và mã lớp." },
        { status: 400 }
      );
    }

    const defaultPassword = "12345678";
    const results = {
      successCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };

    // We process sequentially to avoid overwhelming the auth rate limits
    for (const student of students) {
      const { 
        full_name, 
        username,
        dob,
        gender,
        ethnicity,
        phone_number,
        enroll_status,
        sessions_per_week
      } = student;
      const cleanUsername = username?.toString().toLowerCase().trim();
      
      if (!cleanUsername || !full_name) {
        results.failedCount++;
        results.errors.push(`Dữ liệu rỗng cho tên: ${full_name}`);
        continue;
      }

      const dummyEmail = `${cleanUsername}@aos.local`;

      try {
        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: dummyEmail,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            username: cleanUsername,
            full_name,
            role: "student",
          },
        });

        if (authError) {
          // If user already exists by email/username, we might just want to attach them
          // Assuming uniqueness is enforced by email here
          results.failedCount++;
          results.errors.push(`${cleanUsername}: ${authError.message}`);
          continue;
        }

        const userId = authUser.user.id;

        // 2. Add to Profiles Table via Upsert
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            username: cleanUsername,
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
          await supabaseAdmin.auth.admin.deleteUser(userId);
          results.failedCount++;
          results.errors.push(`${cleanUsername}: Lỗi tạo hồ sơ`);
          continue;
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
          results.failedCount++;
          results.errors.push(`${cleanUsername}: Lỗi xếp lớp (${classError.message})`);
          continue;
        }

        results.successCount++;
      } catch (err: any) {
        results.failedCount++;
        results.errors.push(`${cleanUsername}: Lỗi hệ thống`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Hoàn tất: ${results.successCount} thành công, ${results.failedCount} thất bại.`,
      details: results,
    });
  } catch (error: any) {
    console.error("Unknown Error Batching Students:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tạo danh sách học sinh" },
      { status: 500 }
    );
  }
}
