import { getSupabaseBrowserClient } from '@/lib/supabase';

export interface NodeTest {
  id: string;
  title: string;
  type: string;
  settings: any;
}

export interface TeacherNodeStats {
  tests: NodeTest[];
  stats: {
    completedSubmissions: number;
    inProgressSubmissions: number;
  };
}

export interface StudentNodeStats {
  tests: (NodeTest & { status: string; score: number | null })[];
  stats: {
    completed: number;
    needsReview: number;
    bestScore: number;
    requiredXp: number;
    bestXp: number;
  };
}


/**
 * Lấy danh sách bài kiểm tra và thống kê cho Giáo viên tại 1 node
 */
export async function getTeacherNodeStats(nodeId: number, teacherId?: string): Promise<TeacherNodeStats> {
  const supabase = getSupabaseBrowserClient();
  
  // Fetch tests for this node (kept to display assignment list in sidebar)
  const { data: tests, error: testsError } = await supabase
    .from('tests')
    .select('id, title, type, settings')
    .eq('node_id', nodeId)
    .eq('is_published', true);

  // Initialize query for student_node_progress table
  let query = supabase
    .from('student_node_progress')
    .select('status, student_id')
    .eq('node_id', nodeId);

  // Nếu có teacherId, lọc theo học sinh của giáo viên đó
  if (teacherId) {
    // 1. Lấy danh sách các lớp giáo viên đang dạy
    const { data: teacherClasses } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('teacher_id', teacherId);

    if (teacherClasses && teacherClasses.length > 0) {
      const classIds = teacherClasses.map((c: any) => c.class_id);

      // 2. Lấy danh sách học sinh thuộc các lớp này
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .in('class_id', classIds)
        .eq('status', 'active');

      if (classStudents && classStudents.length > 0) {
        const studentIds = classStudents.map((s: any) => s.student_id);
        // 3. Lọc progress theo danh sách học sinh này
        query = query.in('student_id', studentIds);
      } else {
        // Nếu lớp không có học sinh, trả về 0 luôn
        return {
          tests: tests || [],
          stats: { completedSubmissions: 0, inProgressSubmissions: 0 }
        };
      }
    } else {
      // Nếu giáo viên chưa được gán lớp nào, trả về 0 luôn
      return {
        tests: tests || [],
        stats: { completedSubmissions: 0, inProgressSubmissions: 0 }
      };
    }
  }

  const { data: progressStats, error: statsError } = await query;

  let completed = 0;
  let inProgress = 0;

  if (!statsError && progressStats) {
    progressStats.forEach((p: any) => {
      if (p.status === 'completed') {
        completed++;
      } else if (p.status === 'in_progress') {
        inProgress++;
      }
    });
  }

  return {
    tests: tests || [],
    stats: {
      completedSubmissions: completed,
      inProgressSubmissions: inProgress
    }
  };
}

/**
 * Lấy danh sách bài kiểm tra và thống kê tiến độ cá nhân cho Học sinh tại 1 node
 */
export async function getStudentNodeStats(nodeId: number, studentId: string): Promise<StudentNodeStats> {
  const supabase = getSupabaseBrowserClient();
  
  // Lấy các bài test của node này
  const { data: tests, error: testsError } = await supabase
    .from('tests')
    .select('id, title, type, settings')
    .eq('node_id', nodeId)
    .eq('is_published', true);

  if (testsError || !tests || tests.length === 0) {
    return { tests: [], stats: { completed: 0, needsReview: 0, bestScore: 0, requiredXp: 0, bestXp: 0 } };
  }


  const testIds = tests.map((t: any) => t.id);

  // Lấy submissions của riêng học sinh này
  const { data: submissions, error: subError } = await supabase
    .from('test_submissions')
    .select('test_id, status, score, total_questions, correct_answers')
    .eq('student_id', studentId)
    .in('test_id', testIds);

  const subMap = new Map();
  if (!subError && submissions) {
    submissions.forEach((s: any) => {
      subMap.set(s.test_id, s);
    });
  }

  let needsReview = 0;

  // Get overall progress and node info (required_xp)
  const { data: nodeData } = await supabase
    .from('nodes')
    .select('required_xp, student_node_progress(score, submit_count)')
    .eq('id', nodeId)
    .eq('student_node_progress.student_id', studentId)
    .single();

  const requiredXp = nodeData?.required_xp || 100;
  const progress = (nodeData?.student_node_progress as any)?.[0];
  const bestXp = progress?.score ? parseFloat(progress.score) : 0;
  const submitCount = progress?.submit_count || 0;

  // Calculate percentage based on XP
  const xpPercentage = Math.min(100, Math.round((bestXp / requiredXp) * 100));

  const enrichedTests = tests.map((t: any) => {
    const sub = subMap.get(t.id);
    let stStatus = 'not_started';
    let percentage = 0;

    if (sub) {
      if (sub.status === 'completed' || sub.status === 'submitted') {
        stStatus = 'completed';
        // For individual tests, we still show the score percentage attained in that test
        if (sub.total_questions > 0) {
          if (typeof sub.correct_answers === 'number') {
            percentage = Math.round((sub.correct_answers / sub.total_questions) * 100);
          } else {
            // Fallback to score which is already a percentage (0-100)
            percentage = sub.score || 0;
          }
          percentage = Math.min(100, Math.max(0, percentage));
          if (percentage < 50) needsReview++;
        } else {
          // Fallback if total_questions is missing or 0
          percentage = (sub.score <= 10) ? Math.min(100, sub.score * 10) : Math.min(100, (sub.score || 0));
        }
      } else {
        stStatus = 'in_progress';
      }
    }

    return {
      ...t,
      status: stStatus,
      score: percentage
    };
  });

  return {
    tests: enrichedTests,
    stats: {
      completed: submitCount,
      needsReview,
      bestScore: xpPercentage,
      requiredXp: requiredXp,
      bestXp: bestXp
    }
  };
}

