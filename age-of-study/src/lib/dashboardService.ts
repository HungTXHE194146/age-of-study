import { getSupabaseBrowserClient } from './supabase';
import { getTeacherClasses } from './classService';

export interface DashboardSummary {
  totalClasses: number;
  totalStudents: number;
  studentsActiveToday: number;
  recentActivities: any[];
  classes: any[];
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

    const allClasses = [
      ...(classesResult.data?.homeroom_classes || []),
      ...(classesResult.data?.subject_classes || [])
    ];

    const totalClasses = allClasses.length;
    const totalStudents = allClasses.reduce((acc, c) => acc + (c.student_count || 0), 0);
    const classIds = allClasses.map(c => c.id);

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

    // 4. Combine data
    const summary: DashboardSummary = {
      totalClasses,
      totalStudents,
      studentsActiveToday: activeTodayCount || 0,
      recentActivities: recentActivities || [],
      classes: allClasses
    };

    return { data: summary, error: null };
  } catch (err) {
    console.error('getTeacherDashboardSummary error:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
