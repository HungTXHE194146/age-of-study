import { getSupabaseBrowserClient } from './supabase';
import { getTeacherClasses } from './classService';

export interface DashboardSummary {
  totalClasses: number;
  totalStudents: number;
  studentsActiveToday: number;
  recentActivities: any[];
  classes: any[];
  homeroomClasses: any[];
  subjectClasses: any[];
  homeroomDetails?: {
    classId: number;
    className: string;
    averageScore: number;
    completionRate: number;
    students: any[];
    activityLogs: any[];
  } | null;
}

/**
 * Get aggregated summary data for the teacher dashboard
 */
export async function getTeacherDashboardSummary(teacherId: string): Promise<{ data: DashboardSummary | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  try {
    // 1. Get classes and student counts
    const classesResult = await getTeacherClasses(teacherId);
    if (classesResult.error) throw new Error(classesResult.error);

    const homeroomClasses = classesResult.data?.homeroom_classes || [];
    const subjectClasses = classesResult.data?.subject_classes || [];

    const allClasses = [
      ...homeroomClasses,
      ...subjectClasses
    ];

    const classIds = Array.from(new Set(allClasses.map(c => c.id)));
    const totalClasses = classIds.length;
    const totalStudents = allClasses.reduce((acc, c) => acc + (c.student_count || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Level 1: Fetch active students today, recent activities, and homeroom students in parallel
    const [activeResult, recentResult, studentsResult] = await Promise.all([
      supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds)
        .gte('created_at', today.toISOString()),
      
      supabase
        .from('activity_logs')
        .select(`
          *,
          student:profiles!inner(full_name, username)
        `)
        .in('class_id', classIds)
        .order('created_at', { ascending: false })
        .limit(5),
      
      homeroomClasses.length > 0
        ? supabase
            .from('class_students')
            .select(`
              student_id,
              profile:profiles!inner(id, full_name, username, avatar_url, total_xp)
            `)
            .eq('class_id', homeroomClasses[0].id)
            .eq('status', 'active')
        : Promise.resolve({ data: null, error: null })
    ]);

    if (activeResult.error) console.error('Error fetching active today count:', activeResult.error);
    if (recentResult.error) console.error('Error fetching recent activities:', recentResult.error);
    if (studentsResult.error) console.error('Error fetching homeroom students:', studentsResult.error);

    const activeTodayCount = activeResult.count || 0;
    const recentActivities = recentResult.data || [];
    const studentsData = studentsResult.data || [];

    // Level 2: Fetch detailed homeroom data if exists
    let homeroomDetails = null;
    if (homeroomClasses.length > 0 && studentsData.length > 0) {
      const mainHomeroom = homeroomClasses[0];
      const studentIds = studentsData.map((s: any) => s.student_id);

      // Fetch activity logs and progress in parallel
      const [logsResult, progressResult] = await Promise.all([
        supabase
          .from('activity_logs')
          .select(`
            *,
            student:profiles!inner(full_name, username)
          `)
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('student_node_progress')
          .select('status, score')
          .in('student_id', studentIds)
          .limit(studentIds.length * 2)
      ]);

      if (logsResult.error) console.error('Error fetching homeroom logs:', logsResult.error);
      if (progressResult.error) console.error('Error fetching homeroom progress:', progressResult.error);

      const classActivityLogs = logsResult.data || [];
      const progress = progressResult.data || [];

      const parseGrade = (gl: any) => {
        if (!gl) return 5;
        const match = gl.toString().match(/\d+/);
        return match ? parseInt(match[0]) : 5;
      };

      // Fetch curriculum metadata for truthful progress
      const grade = parseGrade(mainHomeroom.grade);
      const { data: allSubjects } = await supabase.from('subjects').select('id, grade_level');
      const subjectIds = (allSubjects || [])
        .filter((s: { id: number; grade_level: string }) => parseGrade(s.grade_level) === grade)
        .map((s: { id: number }) => s.id);
      
      let gradeTotalNodes = 0;
      if (subjectIds.length > 0) {
        const { count } = await supabase
          .from('nodes')
          .select('id', { count: 'exact', head: true })
          .in('subject_id', subjectIds)
          .in('node_type', ['lesson', 'content']);
        gradeTotalNodes = count || 0;
      }

      let totalScore = 0;
      let scoreCount = 0;
      let completedCount = 0;

      progress.forEach((p: any) => {
        if (p.status === 'completed') completedCount++;
        if (p.score) {
          const scoreVal = typeof p.score === 'string' ? Number(p.score) : p.score;
          if (!isNaN(scoreVal)) {
            totalScore += Math.min(100, scoreVal);
            scoreCount++;
          }
        }
      });

      const totalPossibleCompletions = gradeTotalNodes * studentIds.length;

      homeroomDetails = {
        classId: mainHomeroom.id,
        className: mainHomeroom.name,
        averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        completionRate: totalPossibleCompletions > 0 ? (completedCount / totalPossibleCompletions) * 100 : 0,
        students: studentsData,
        activityLogs: classActivityLogs
      };
    }

    // 5. Combine data
    const summary: DashboardSummary = {
      totalClasses,
      totalStudents,
      studentsActiveToday: activeTodayCount || 0,
      recentActivities: recentActivities || [],
      classes: allClasses,
      homeroomClasses,
      subjectClasses,
      homeroomDetails
    };

    return { data: summary, error: null };
  } catch (err) {
    console.error('getTeacherDashboardSummary error:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
