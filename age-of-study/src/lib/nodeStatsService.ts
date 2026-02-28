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
    bestScore: number; // Mới
  };
}


/**
 * Lấy danh sách bài kiểm tra và thống kê cho Giáo viên tại 1 node
 */
export async function getTeacherNodeStats(nodeId: number): Promise<TeacherNodeStats> {
  const supabase = getSupabaseBrowserClient();
  
  // Lấy các bài test của node này
  const { data: tests, error: testsError } = await supabase
    .from('tests')
    .select('id, title, type, settings')
    .eq('node_id', nodeId)
    .eq('is_published', true);

  if (testsError || !tests || tests.length === 0) {
    return { tests: [], stats: { completedSubmissions: 0, inProgressSubmissions: 0 } };
  }

  const testIds = tests.map((t: any) => t.id);

  // Lấy thống kê submission
  const { data: submissions, error: subError } = await supabase
    .from('test_submissions')
    .select('id, status')
    .in('test_id', testIds);

  let completed = 0;
  let inProgress = 0;

  if (!subError && submissions) {
    submissions.forEach((sub: any) => {
      if (sub.status === 'completed' || sub.status === 'submitted') {
        completed++;
      } else {
        inProgress++;
      }
    });
  }

  return {
    tests,
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
    return { tests: [], stats: { completed: 0, needsReview: 0, bestScore: 0 } };
  }


  const testIds = tests.map((t: any) => t.id);

  // Lấy submissions của riêng học sinh này
  const { data: submissions, error: subError } = await supabase
    .from('test_submissions')
    .select('test_id, status, score, total_questions')
    .eq('student_id', studentId)
    .in('test_id', testIds);

  const subMap = new Map();
  if (!subError && submissions) {
    submissions.forEach((s: any) => {
      subMap.set(s.test_id, s);
    });
  }

  let completed = 0;
  let needsReview = 0;

  const enrichedTests = tests.map((t: any) => {
    const sub = subMap.get(t.id);
    let stStatus = 'not_started';
    let score = null;

    if (sub) {
      if (sub.status === 'completed' || sub.status === 'submitted') {
        stStatus = 'completed';
        score = sub.score;
        completed++;
        
        // Giả sử làm đúng dưới 50% là need review
        if (sub.total_questions > 0) {
           const pct = sub.score / sub.total_questions;
           if (pct < 0.5) needsReview++;
        }
      } else {
        stStatus = 'in_progress';
      }
    }

    return {
      ...t,
      status: stStatus,
      score
    };
  });

  const bestScore = Math.max(0, ...enrichedTests.map((t: any) => t.score || 0));


  return {
    tests: enrichedTests,
    stats: {
      completed,
      needsReview,
      bestScore
    }
  };
}

