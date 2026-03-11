import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/adminAuth";
import { createAuditLog } from "@/lib/auditService";

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

interface HomeroomAssignment {
  class_id?: number;
  class_name: string;
  teacher_id: string;
  grade?: number;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUserId = authResult.userId;

    const body = await request.json();
    const { assignments } = body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: "Danh sách phân công không hợp lệ hoặc trống" },
        { status: 400 }
      );
    }

    let successCount = 0;
    const errors: string[] = [];

    // Lấy môn học mặc định (có thể là môn HDTN hoặc một subject_id đại diện)
    // Hoặc ta có thể insert class_teachers với subject_id = null nếu db cho phép.
    // Kiểm tra DB schema: class_teachers.subject_id is nullable (bigint, không có not null constraint).
    // Tuy nhiên, logic UI cũ có thể cần subject_id. Theo code ở admin/classes thì assignTeacherToClass bắt buộc subject_id.
    // Vậy ta sẽ thử không cấp subject_id và set is_homeroom = true. 
    // Trong schema: class_teachers (id, class_id, teacher_id, subject_id, is_homeroom, created_at)
    // subject_id không có NOT NULL => có thể để null nếu chỉ là GVCN. Nếu họ dạy Toán thêm thì sẽ bị trùng? 
    // Nếu db bắt buộc subject_id trong app -> ta sẽ lấy môn học đầu tiên hoặc subject_id = null.
    // Tạm để null.

    for (const assignment of assignments as HomeroomAssignment[]) {
      let { class_id } = assignment;
      const { class_name, teacher_id, grade } = assignment;

      if (!class_name || !teacher_id) {
        errors.push("Bỏ qua 1 dòng do thiếu tên lớp hoặc teacher_id.");
        continue;
      }

      // Automatically create the class if it doesn't exist (class_id is missing)
      if (!class_id) {
         // Create the class
         const classCode = globalThis.crypto.randomUUID();
         
         const now = new Date();
         const year = now.getFullYear();
         const month = now.getMonth();
         const schoolYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

         const { data: newClass, error: createError } = await supabaseAdmin
           .from('classes')
           .insert({
             name: class_name,
             grade: grade || 1,
             class_code: classCode,
             school_year: schoolYear,
             status: 'active'
           })
           .select('id')
           .single();

         if (createError || !newClass) {
           console.error("Error creating missing class:", createError);
           errors.push(`Lỗi tạo lớp mới ${class_name}`);
           continue;
         }
         class_id = newClass.id;
      }

      const { error: deleteError } = await supabaseAdmin
        .from("class_teachers")
        .delete()
        .match({ class_id, is_homeroom: true })
        .neq('teacher_id', teacher_id); // Don't delete if it's the same teacher

      if (deleteError) {
        console.error("Error deleting old homeroom teacher:", deleteError);
        errors.push(`Lỗi xóa GVCN cũ cho lớp ID ${class_id}`);
        continue;
      }

      // Kiểm tra xem GV này đã được gán vào lớp chưa (có thể là dạy môn rổi, chưa phải GVCN)
      // Nếu đã gán rồi, chỉ update thành is_homeroom=true.
      // Nếu chưa có, tạo row mới subject_id = null.
      const { data: existingRoles, error: selectError } = await supabaseAdmin
        .from('class_teachers')
        .select('id')
        .eq('class_id', class_id)
        .eq('teacher_id', teacher_id)
        .limit(1);

      if (selectError) {
         console.error("Error finding teacher:", selectError);
         errors.push(`Lỗi tìm thông tin phân công lớp ID ${class_id}`);
         continue;
      }

      if (existingRoles && existingRoles.length > 0) {
        // GV này đã có trong lớp (VD: dạy môn A). Ta update record đó thành is_homeroom = true
        const { error: updateError } = await supabaseAdmin
          .from("class_teachers")
          .update({ is_homeroom: true })
          .eq("id", existingRoles[0].id);

        if (updateError) {
          console.error("Error updating homeroom role:", updateError);
          errors.push(`Lỗi cập nhật GVCN lớp ID ${class_id}`);
          continue;
        }
      } else {
        // Giáo viên chưa có record nào ở lớp này, thêm record null subject
        const { error: insertError } = await supabaseAdmin
          .from("class_teachers")
          .insert({
            class_id,
            teacher_id,
            is_homeroom: true,
          });

        if (insertError) {
          console.error("Error inserting homeroom role:", insertError);
          errors.push(`Lỗi gán GVCN lớp ID ${class_id}`);
          continue;
        }
      }

      successCount++;
    }

    if (successCount > 0) {
      await createAuditLog(adminUserId, {
        action: 'class_updated',
        resourceType: 'class',
        resourceId: 'multiple',
        description: `Import thành công ${successCount} giáo viên chủ nhiệm từ file Excel.`,
      }, request);
    }

    return NextResponse.json({
      success: true,
      message: `Đã phân công thành công ${successCount} GVCN.`,
      errors: errors.length > 0 ? errors : undefined,
      successCount,
    });
  } catch (error: any) {
    console.error("Error importing homeroom teachers:", error);
    return NextResponse.json(
      { error: `Lỗi máy chủ: ${error.message}` },
      { status: 500 }
    );
  }
}
