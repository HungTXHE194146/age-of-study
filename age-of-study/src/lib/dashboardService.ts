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

    // 2. Get students active today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: activeTodayCount, error: activeError } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .in('class_id', classIds)
      .gte('created_at', today.toISOString());

    if (activeError) console.error('Error fetching active today count:', activeError);

    // 3. Get recent activities (last 5)
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('activity_logs')
      .select(`
        *,
        student:profiles!inner(full_name, username)
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (activitiesError) console.error('Error fetching recent activities:', activitiesError);

    // 4. Fetch detailed homeroom data if exists
    let homeroomDetails = null;
    if (homeroomClasses.length > 0) {
      const mainHomeroom = homeroomClasses[0];
      
      // Fetch students for this homeroom
      const { data: students, error: studentsError } = await supabase
        .from('class_students')
        .select(`
          student_id,
          profile:profiles!inner(id, full_name, username, avatar_url, total_xp)
        `)
        .eq('class_id', mainHomeroom.id)
        .eq('status', 'active');

      if (studentsError) console.error('Error fetching homeroom students:', studentsError);

      const studentIds = (students || []).map((s: any) => s.student_id);

      // Fetch activity logs for these students
      const { data: classActivityLogs, error: classLogsError } = await supabase
        .from('activity_logs')
        .select(`
          *,
          student:profiles!inner(full_name, username)
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (classLogsError) console.error('Error fetching homeroom logs:', classLogsError);

      // Fetch progress for stats
      const { data: progress, error: progressError } = await supabase
        .from('student_node_progress')
        .select('status, score')
        .in('student_id', studentIds);

      if (progressError) console.error('Error fetching homeroom progress:', progressError);

      let totalScore = 0;
      let scoreCount = 0;
      let completedCount = 0;
      const totalNodes = progress?.length || 0;

      if (progress) {
        progress.forEach((p: any) => {
          if (p.status === 'completed') completedCount++;
          if (p.score) {
            totalScore += p.score;
            scoreCount++;
          }
        });
      }

      homeroomDetails = {
        classId: mainHomeroom.id,
        className: mainHomeroom.name,
        averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        completionRate: totalNodes > 0 ? (completedCount / totalNodes) * 100 : 0,
        students: students || [],
        activityLogs: classActivityLogs || []
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
