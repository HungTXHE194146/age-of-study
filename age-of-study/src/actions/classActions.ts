"use server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { ClassDetail } from "@/types/class";

/**
 * Server Action: Get class detail securely bypassing RLS
 * This allows students to view the full student list, XP leaderboard, and activity logs
 * even if their RLS policies normally prevent them from seeing other students' data.
 */
export async function getClassDetailServer(classId: number): Promise<{ data: ClassDetail | null, error: string | null }> {
  const supabase = getSupabaseServerClient();

  try {
    const [classResult, teachersResult, studentsResult] = await Promise.all([
      supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single(),
      
      supabase
        .from('class_teachers')
        .select(`
          *,
          teacher:profiles!inner(id, username, full_name, avatar_url),
          subject:subjects!inner(id, name)
        `)
        .eq('class_id', classId),
      
      supabase
        .from('class_students')
        .select(`
          *,
          profile:profiles!inner(
            id, username, full_name, avatar_url, grade, total_xp, last_study_date,
            dob, gender, ethnicity, phone_number, enroll_status, sessions_per_week,
            activity_logs (
              id, activity_type, description, xp_earned, created_at
            ),
            student_node_progress (
              node_id, status, score, last_accessed_at, completed_at,
              nodes ( title )
            )
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
    ]);

    if (classResult.error) return { data: null, error: classResult.error.message };
    if (teachersResult.error) return { data: null, error: teachersResult.error.message };
    if (studentsResult.error) return { data: null, error: studentsResult.error.message };

    const classData = classResult.data as any;
    const teachersData = (teachersResult.data || []) as any[];
    const studentsData = (studentsResult.data || []) as any[];

    const homeroomTeachers = teachersData.filter((ct: any) => ct.is_homeroom);
    const homeroomTeacher = homeroomTeachers.length > 0 ? {
      id: homeroomTeachers[0].teacher.id,
      full_name: homeroomTeachers[0].teacher.full_name,
      subjects: homeroomTeachers.map((ct: any) => ct.subject),
    } : null;

    const subjectTeachers = teachersData
      .filter((ct: any) => !ct.is_homeroom)
      .map((ct: any) => ({
        teacher: ct.teacher,
        subject: ct.subject,
      }));

    const classDetail: ClassDetail = {
      ...classData,
      homeroom_teacher: homeroomTeacher,
      subject_teachers: subjectTeachers,
      students: studentsData.map((s: any) => {
        let latestActivity = null;
        if (s.profile.activity_logs && s.profile.activity_logs.length > 0) {
          const sortedActs = [...s.profile.activity_logs].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          latestActivity = sortedActs[0];
        }

        let latestProgress = null;
        if (s.profile.student_node_progress && s.profile.student_node_progress.length > 0) {
          const sortedProg = [...s.profile.student_node_progress].sort((a, b) => {
            const timeA = new Date(a.last_accessed_at || a.completed_at || 0).getTime();
            const timeB = new Date(b.last_accessed_at || b.completed_at || 0).getTime();
            return timeB - timeA;
          });
          latestProgress = sortedProg[0];
        }

        return {
          student_id: s.student_id,
          class_id: s.class_id,
          joined_at: s.joined_at,
          left_at: s.left_at,
          status: s.status,
          profile: s.profile,
          latest_activity: latestActivity,
          latest_progress: latestProgress,
        };
      }),
    };

    return { data: classDetail, error: null };
  } catch (err: any) {
    console.error('getClassDetailServer exception:', err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}
