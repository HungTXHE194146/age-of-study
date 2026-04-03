import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTeacher } from "@/lib/adminAuth";


// Init Supabase Admin to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    // Verify teacher authentication
    const authResult = await verifyTeacher(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    const teacherId = authResult.userId;

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get("classId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Thiếu ID học sinh" },
        { status: 400 }
      );
    }

    // Parallelize independent initial fetches
    const [profileRes, activitiesRes, teacherClassesRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, username, total_xp, current_streak, last_study_date")
        .eq("id", studentId)
        .single(),
      supabaseAdmin
        .from("activity_logs")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("class_teachers")
        .select("class_id")
        .eq("teacher_id", teacherId)
    ]);

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin học sinh" },
        { status: 404 }
      );
    }

    const classIds = teacherClassesRes.data?.map(c => c.class_id) || [];
    
    // Verify Resource Scope & Fetch extra data in parallel
    const associationCheckPromise = supabaseAdmin
      .from("class_students")
      .select("class_id")
      .eq("student_id", studentId)
      .in("class_id", classIds)
      .limit(1)
      .single();

    // 2. Process Timeline (Activity Logs) if available
    let activities: any[] = [];
    let testsDataPromise: Promise<{ data: any[] | null }> = Promise.resolve({ data: null });

    if (!activitiesRes.error && activitiesRes.data) {
      const testIdsToFetch = activitiesRes.data
        .filter((act: any) => 
          act.activity_type === 'test_completed' && 
          act.metadata?.test_id && 
          (act.description === "Hoàn thành bài tập" || act.description?.startsWith("Hoàn thành bài tập với điểm số"))
        )
        .map((act: any) => act.metadata.test_id);

      if (testIdsToFetch.length > 0) {
        testsDataPromise = supabaseAdmin
          .from("tests")
          .select("id, title")
          .in("id", testIdsToFetch) as any;
      }
    }

    // 3. Fetch nodes and progress if classId is provided
    let nodesPromise: Promise<{ data: any[] | null }> = Promise.resolve({ data: null });
    let studentProgressPromise: Promise<{ data: any[] | null }> = Promise.resolve({ data: null });

    if (classId) {
      // Get subject IDs first to then fetch nodes
      const { data: classTeachers } = await supabaseAdmin
        .from("class_teachers")
        .select("subject_id")
        .eq("class_id", classId);
      
      const subjectIds = classTeachers?.filter(c => c.subject_id).map(c => c.subject_id) || [];
      
      if (subjectIds.length > 0) {
        nodesPromise = supabaseAdmin
          .from("nodes")
          .select("id, title, node_type")
          .in("subject_id", subjectIds)
          .order("order_index", { ascending: true }) as any;
        
        studentProgressPromise = supabaseAdmin
          .from("student_node_progress")
          .select("node_id, status, score")
          .eq("student_id", studentId) as any;
      }
    }

    // Wait for all remaining queries
    const [associationRes, testsDataRes, nodesRes, studentProgressRes] = await Promise.all([
      associationCheckPromise,
      testsDataPromise,
      nodesPromise,
      studentProgressPromise
    ]);

    if (associationRes.error || !associationRes.data) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập thông tin học sinh này." },
        { status: 403 }
      );
    }

    // Process activities
    const testTitleMap = new Map();
    if (testsDataRes.data) {
      (testsDataRes.data as any[]).forEach(t => testTitleMap.set(t.id, t.title));
    }

    if (activitiesRes.data) {
      activities = (activitiesRes.data as any[]).map((act: any) => {
        const date = new Date(act.created_at);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        
        const timeStr = isToday 
          ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} Hôm nay`
          : date.toLocaleDateString('vi-VN');

        let displayDesc = act.description;
        if (act.activity_type === 'test_completed' && act.metadata?.test_id) {
          const title = testTitleMap.get(act.metadata.test_id);
          if (title && (displayDesc === "Hoàn thành bài tập" || displayDesc?.startsWith("Hoàn thành bài tập với điểm số"))) {
            const scorePart = act.metadata.score !== undefined ? ` với điểm số ${act.metadata.score}%` : "";
            displayDesc = `Hoàn thành bài tập: ${title}${scorePart}`;
          }
        }
        return { id: act.id, time: timeStr, type: act.activity_type, desc: displayDesc };
      });
    }

    // Process progress
    let progress: any[] = [];
    if (nodesRes.data) {
      const progressMap = new Map();
      if (studentProgressRes.data) {
        (studentProgressRes.data as any[]).forEach(p => progressMap.set(p.node_id, p));
      }

      progress = (nodesRes.data as any[])
        .filter((n: any) => n.node_type === 'lesson' || n.node_type === 'content')
        .map((node: any) => {
          const p = progressMap.get(node.id);
          return {
            id: `node-${node.id}`,
            title: node.title,
            status: p ? p.status : "not_started",
            score: p && p.score ? p.score : "-",
          };
        });
    }

    // Final fallback for progress if empty
    if (progress.length === 0) {
      const { data: rawProgress } = await supabaseAdmin
         .from("student_node_progress")
         .select(`node_id, status, score, nodes ( title )`)
         .eq("student_id", studentId);

      if (rawProgress) {
        progress = rawProgress.map((p: any) => ({
          id: `node-${p.node_id}`,
          title: (p as any).nodes?.title || "Bài học không tên",
          status: p.status,
          score: p.score || "-",
        }));
      }
    }

    return NextResponse.json({
      profile: profileRes.data,
      activities: activities.length > 0 ? activities : [
        // Dummy default if empty so the UI doesn't look totally blank for new students
        {
          id: "empty-1",
          time: "Gần đây",
          type: "login",
          desc: "Chưa có hoạt động học tập nào.",
        }
      ],
      progress: progress.length > 0 ? progress : [
        { id: "empty", title: "Chưa có dữ liệu bài học", status: "not_started", score: "-" }
      ],
    });
  } catch (error: any) {
    console.error("Progress API Error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải nhật ký học tập" },
      { status: 500 }
    );
  }
}
