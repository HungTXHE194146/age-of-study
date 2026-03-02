import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get("classId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Thiếu ID học sinh" },
        { status: 400 }
      );
    }

    // 1. Fetch Profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("full_name, username, total_xp, current_streak, last_study_date")
      .eq("id", studentId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin học sinh" },
        { status: 404 }
      );
    }

    // 2. Fetch Timeline (Activity Logs)
    const { data: activitiesData, error: activitiesErr } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);

    let activities: any[] = [];
    if (!activitiesErr && activitiesData) {
      // Collect unique test IDs from metadata for generic "completed" activities
      const testIdsToFetch = activitiesData
        .filter((act: any) => 
          act.activity_type === 'test_completed' && 
          act.metadata?.test_id && 
          (act.description === "Hoàn thành bài tập" || act.description?.startsWith("Hoàn thành bài tập với điểm số"))
        )
        .map((act: any) => act.metadata.test_id);

      let testTitleMap = new Map();
      if (testIdsToFetch.length > 0) {
        const { data: testsData } = await supabaseAdmin
          .from("tests")
          .select("id, title")
          .in("id", testIdsToFetch);
        
        if (testsData) {
          testsData.forEach((t: any) => testTitleMap.set(t.id, t.title));
        }
      }

      activities = activitiesData.map((act: any) => {
        // Format relative time (e.g. "Hôm nay", "Hôm qua", or specific date)
        const date = new Date(act.created_at);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        
        const timeStr = isToday 
          ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} Hôm nay`
          : date.toLocaleDateString('vi-VN');

        let displayDesc = act.description;

        // Enhance generic description with test title if available
        if (act.activity_type === 'test_completed' && act.metadata?.test_id) {
          const title = testTitleMap.get(act.metadata.test_id);
          if (title && (displayDesc === "Hoàn thành bài tập" || displayDesc?.startsWith("Hoàn thành bài tập với điểm số"))) {
            const scorePart = act.metadata.score !== undefined ? ` với điểm số ${act.metadata.score}%` : "";
            displayDesc = `Hoàn thành bài tập: ${title}${scorePart}`;
          }
        }

        return {
          id: act.id,
          time: timeStr,
          type: act.activity_type,
          desc: displayDesc,
        };
      });
    }

    // 3. Fetch Skill Tree Progress
    let progress: any[] = [];
    
    // If classId is provided, we try to find the subject(s) for this class to get the full node tree
    if (classId) {
      // Find subjects for this class
      const { data: classTeachers } = await supabaseAdmin
        .from("class_teachers")
        .select("subject_id")
        .eq("class_id", classId);

      if (classTeachers && classTeachers.length > 0) {
        // Assuming we take the first subject for simplicity or we can fetch all nodes for all subjects
        const subjectIds = classTeachers.filter((c: any) => c.subject_id).map((c: any) => c.subject_id);
        
        if (subjectIds.length > 0) {
          // Fetch all nodes for these subjects
          const { data: nodes } = await supabaseAdmin
            .from("nodes")
            .select("id, title, node_type")
            .in("subject_id", subjectIds)
            .order("order_index", { ascending: true });

          if (nodes && nodes.length > 0) {
            // Fetch student progress for these nodes
            const { data: studentProgress } = await supabaseAdmin
              .from("student_node_progress")
              .select("node_id, status, score")
              .eq("student_id", studentId);

            const progressMap = new Map();
            if (studentProgress) {
              studentProgress.forEach((p: any) => progressMap.set(p.node_id, p));
            }

            progress = nodes.filter((n: any) => n.node_type === 'lesson' || n.node_type === 'content').map((node: any) => {
              const p = progressMap.get(node.id);
              return {
                id: `node-${node.id}`,
                title: node.title,
                status: p ? p.status : "not_started",
                score: p && p.score ? p.score : "-",
              };
            });
          }
        }
      }
    }

    // If no progress found (e.g. no subject linked or no nodes), fallback to just joined progress
    if (progress.length === 0) {
      const { data: rawProgress } = await supabaseAdmin
         .from("student_node_progress")
         .select(`
           node_id,
           status,
           score,
           nodes ( title )
         `)
         .eq("student_id", studentId);

      if (rawProgress) {
        progress = rawProgress.map((p: any) => ({
          id: `node-${p.node_id}`,
          title: p.nodes?.title || "Bài học không tên",
          status: p.status,
          score: p.score || "-",
        }));
      }
    }

    return NextResponse.json({
      profile,
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
