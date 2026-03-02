/**
 * Analytics Service
 * Handles statistical analysis for classes, students, and teachers
 */

import { getSupabaseBrowserClient } from './supabase';

export interface ClassAnalytics {
  classId: number;
  className: string;
  grade: number;
  schoolYear: string;
  studentCount: number;
  averageScore: number;
  completionRate: number;
  totalXP: number;
  averageXP: number;
  activeStudents: number;
  completedNodes: number;
  totalAssignedNodes: number;
}

export interface TeacherActivity {
  teacherId: string;
  fullName: string | null;
  username: string | null;
  email: string | null;
  totalClasses: number;
  homeroomClasses: number;
  subjectClasses: number;
  totalStudents: number;
  lastActive: string | null;
  activityStatus: 'active' | 'inactive' | 'never';
  daysInactive: number;
  recentLogins: number;
  subjects: string[];
}

export interface ClassComparisonData {
  classes: ClassAnalytics[];
  summary: {
    totalClasses: number;
    totalStudents: number;
    averageScore: number;
    averageCompletion: number;
    highestPerformingClass: string | null;
    lowestPerformingClass: string | null;
  };
}

export interface TeacherActivityReport {
  teachers: TeacherActivity[];
  summary: {
    totalTeachers: number;
    activeTeachers: number;
    inactiveTeachers: number;
    neverLoggedIn: number;
    averageClassesPerTeacher: number;
  };
}

/**
 * Get analytics for all classes with comparison metrics
 */
export async function getClassComparisonData(): Promise<{
  data: ClassComparisonData | null;
  error: string | null;
}> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Get all active classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name, grade, school_year')
      .eq('status', 'active')
      .order('grade', { ascending: true })
      .order('name', { ascending: true });

    if (classesError) {
      return { data: null, error: classesError.message };
    }

    if (!classes || classes.length === 0) {
      return {
        data: {
          classes: [],
          summary: {
            totalClasses: 0,
            totalStudents: 0,
            averageScore: 0,
            averageCompletion: 0,
            highestPerformingClass: null,
            lowestPerformingClass: null,
          },
        },
        error: null,
      };
    }

    // Get analytics for each class
    const classAnalytics: ClassAnalytics[] = [];

    for (const cls of classes) {
      // Get student IDs in this class
      const { data: classStudents, error: classStudentsError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', cls.id)
        .eq('status', 'active');

      if (classStudentsError) {
        console.error(`Error fetching students for class ${cls.id}:`, classStudentsError.message || classStudentsError);
        continue;
      }

      const studentIds = classStudents?.map((s: { student_id: string }) => s.student_id) || [];
      const studentCount = studentIds.length;
      let totalXP = 0;
      let activeStudents = 0;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get profiles for students in this class
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, total_xp, last_active_at')
          .in('id', studentIds);

        if (profiles) {
          for (const profile of profiles) {
            totalXP += profile.total_xp || 0;
            if (profile.last_active_at && new Date(profile.last_active_at) > weekAgo) {
              activeStudents++;
            }
          }
        }
      }

      // Get completion data from student_node_progress
      const { data: progressData, error: progressError } = await supabase
        .from('student_node_progress')
        .select('status, score, student_id')
        .in('student_id', studentIds);

      let completedNodes = 0;
      let totalNodes = 0;
      let totalScore = 0;
      let scoreCount = 0;

      if (progressData) {
        totalNodes = progressData.length;
        for (const progress of progressData) {
          if (progress.status === 'completed') {
            completedNodes++;
          }
          if (progress.score !== null && progress.score > 0) {
            totalScore += progress.score;
            scoreCount++;
          }
        }
      }

      const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;
      const completionRate = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;
      const averageXP = studentCount > 0 ? totalXP / studentCount : 0;

      classAnalytics.push({
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        schoolYear: cls.school_year,
        studentCount,
        averageScore,
        completionRate,
        totalXP,
        averageXP,
        activeStudents,
        completedNodes,
        totalAssignedNodes: totalNodes,
      });
    }

    // Calculate summary statistics
    const totalStudents = classAnalytics.reduce((sum, c) => sum + c.studentCount, 0);
    const avgScore =
      classAnalytics.length > 0
        ? classAnalytics.reduce((sum, c) => sum + c.averageScore, 0) / classAnalytics.length
        : 0;
    const avgCompletion =
      classAnalytics.length > 0
        ? classAnalytics.reduce((sum, c) => sum + c.completionRate, 0) / classAnalytics.length
        : 0;

    // Find highest and lowest performing classes
    let highestClass = null;
    let lowestClass = null;
    if (classAnalytics.length > 0) {
      const sorted = [...classAnalytics].sort((a, b) => b.averageScore - a.averageScore);
      highestClass = sorted[0].className;
      lowestClass = sorted[sorted.length - 1].className;
    }

    return {
      data: {
        classes: classAnalytics,
        summary: {
          totalClasses: classAnalytics.length,
          totalStudents,
          averageScore: avgScore,
          averageCompletion: avgCompletion,
          highestPerformingClass: highestClass,
          lowestPerformingClass: lowestClass,
        },
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get teacher activity report
 */
export async function getTeacherActivityReport(): Promise<{
  data: TeacherActivityReport | null;
  error: string | null;
}> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Get all teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, username, full_name, email, last_active_at, created_at')
      .eq('role', 'teacher')
      .order('full_name', { ascending: true });

    if (teachersError) {
      return { data: null, error: teachersError.message };
    }

    if (!teachers || teachers.length === 0) {
      return {
        data: {
          teachers: [],
          summary: {
            totalTeachers: 0,
            activeTeachers: 0,
            inactiveTeachers: 0,
            neverLoggedIn: 0,
            averageClassesPerTeacher: 0,
          },
        },
        error: null,
      };
    }

    // Get class assignments for all teachers
    const { data: classAssignments, error: assignmentsError } = await supabase
      .from('class_teachers')
      .select(`
        teacher_id,
        is_homeroom,
        classes!class_teachers_class_id_fkey (
          id,
          status
        ),
        subjects (
          name
        )
      `)
      .eq('classes.status', 'active');

    if (assignmentsError) {
      console.error('Error fetching class assignments:', assignmentsError);
    }

    // Get student counts per class for teacher stats
    const { data: studentCounts, error: studentCountsError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('status', 'active');

    const studentCountMap: Record<number, number> = {};
    if (studentCounts) {
      for (const sc of studentCounts) {
        studentCountMap[sc.class_id] = (studentCountMap[sc.class_id] || 0) + 1;
      }
    }

    // Get activity logs for recent logins (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Process teacher data
    const teacherActivities: TeacherActivity[] = [];
    let activeCount = 0;
    let inactiveCount = 0;
    let neverLoggedInCount = 0;

    for (const teacher of teachers) {
      // Get class assignments for this teacher
      const assignments = classAssignments?.filter((a: any) => a.teacher_id === teacher.id) || [];
      const homeroomCount = assignments.filter((a: any) => a.is_homeroom).length;
      const subjectCount = assignments.filter((a: any) => !a.is_homeroom).length;
      const totalClasses = assignments.length;

      // Calculate total students
      const classIds = assignments.map((a: any) => a.classes?.id).filter(Boolean);
      const totalStudents = classIds.reduce((sum: number, classId: number) => sum + (studentCountMap[classId] || 0), 0);

      // Get unique subjects
      const subjects: string[] = [...new Set(assignments.map((a: any) => a.subjects?.name).filter(Boolean))] as string[];

      // Determine activity status
      let activityStatus: 'active' | 'inactive' | 'never' = 'never';
      let daysInactive = 0;

      if (teacher.last_active_at) {
        const lastActive = new Date(teacher.last_active_at);
        const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        daysInactive = daysSinceActive;

        if (lastActive > weekAgo) {
          activityStatus = 'active';
          activeCount++;
        } else {
          activityStatus = 'inactive';
          inactiveCount++;
        }
      } else {
        neverLoggedInCount++;
      }

      teacherActivities.push({
        teacherId: teacher.id,
        fullName: teacher.full_name,
        username: teacher.username,
        email: teacher.email,
        totalClasses,
        homeroomClasses: homeroomCount,
        subjectClasses: subjectCount,
        totalStudents,
        lastActive: teacher.last_active_at,
        activityStatus,
        daysInactive,
        recentLogins: 0, // Could be enhanced with activity_logs
        subjects,
      });
    }

    const averageClasses =
      teacherActivities.length > 0
        ? teacherActivities.reduce((sum, t) => sum + t.totalClasses, 0) / teacherActivities.length
        : 0;

    return {
      data: {
        teachers: teacherActivities,
        summary: {
          totalTeachers: teacherActivities.length,
          activeTeachers: activeCount,
          inactiveTeachers: inactiveCount,
          neverLoggedIn: neverLoggedInCount,
          averageClassesPerTeacher: averageClasses,
        },
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Export class comparison data to CSV format
 */
export function exportClassDataToCSV(classes: ClassAnalytics[]): string {
  const headers = [
    'Tên lớp',
    'Khối',
    'Năm học',
    'Sĩ số',
    'Điểm TB',
    'Hoàn thành (%)',
    'HS hoạt động',
    '% Hoạt động',
    'HS không HĐ',
    'Tiến độ (hoàn thành/tổng)',
  ];

  const rows = classes.map((c) => {
    const activeRate = c.studentCount > 0 ? ((c.activeStudents / c.studentCount) * 100).toFixed(1) : '0.0';
    const inactiveStudents = c.studentCount - c.activeStudents;
    return [
      c.className,
      c.grade.toString(),
      c.schoolYear,
      c.studentCount.toString(),
      c.averageScore.toFixed(2),
      c.completionRate.toFixed(2),
      c.activeStudents.toString(),
      activeRate,
      inactiveStudents.toString(),
      `${c.completedNodes}/${c.totalAssignedNodes}`,
    ];
  });

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csv;
}

/**
 * Export teacher activity data to CSV format
 */
export function exportTeacherDataToCSV(teachers: TeacherActivity[]): string {
  const headers = [
    'Họ tên',
    'Email',
    'Tổng lớp',
    'Lớp chủ nhiệm',
    'Lớp bộ môn',
    'Tổng học sinh',
    'Môn giảng dạy',
    'Trạng thái',
    'Số ngày không hoạt động',
    'Lần cuối hoạt động',
  ];

  const rows = teachers.map((t) => [
    t.fullName || t.username || 'N/A',
    t.email || 'N/A',
    t.totalClasses.toString(),
    t.homeroomClasses.toString(),
    t.subjectClasses.toString(),
    t.totalStudents.toString(),
    t.subjects.join('; ') || 'Chưa có',
    t.activityStatus === 'active' ? 'Hoạt động' : t.activityStatus === 'inactive' ? 'Không hoạt động' : 'Chưa đăng nhập',
    t.daysInactive.toString(),
    t.lastActive ? new Date(t.lastActive).toLocaleDateString('vi-VN') : 'Chưa bao giờ',
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csv;
}
