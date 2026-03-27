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

export interface TeacherClassAnalytics {
  classes: ClassAnalytics[];
  summary: {
    totalClasses: number;
    totalStudents: number;
    averageScore: number;
    averageCompletion: number;
  };
}

export interface StudentReportData {
  studentId: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  totalXP: number;
  level: number;
  completedNodes: number;
  totalNodes: number;
  averageTestScore: number;
  testHistory: {
    testId: string;
    testTitle: string;
    score: number;
    submittedAt: string;
    type: string;
  }[];
  nodeHistory: {
    nodeId: string;
    nodeTitle: string;
    status: string;
    completedAt: string | null;
  }[];
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

    // --- BATCH QUERIES: Replace N+1 loops with 3 parallel batch queries ---
    const allClassIds = classes.map((c: { id: number }) => c.id);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Batch 1: All active students across all classes
    const { data: allClassStudents, error: classStudentsError } = await supabase
      .from('class_students')
      .select('class_id, student_id')
      .in('class_id', allClassIds)
      .eq('status', 'active');

    if (classStudentsError) {
      return { data: null, error: classStudentsError.message };
    }

    // Build map: classId -> studentIds
    const classStudentMap: Record<number, string[]> = {};
    for (const row of allClassStudents || []) {
      if (!classStudentMap[row.class_id]) classStudentMap[row.class_id] = [];
      classStudentMap[row.class_id].push(row.student_id);
    }

    // Collect all unique student IDs
    const allStudentIds = [...new Set((allClassStudents || []).map((s: { student_id: string }) => s.student_id))];

    // Batch 2 & 3: Run in parallel — profiles and progress for all students at once
    const [profilesResult, progressResult] = await Promise.all([
      allStudentIds.length > 0
        ? supabase.from('profiles').select('id, total_xp, last_active_at').in('id', allStudentIds)
        : Promise.resolve({ data: [], error: null }),
      allStudentIds.length > 0
        ? supabase.from('student_node_progress').select('status, score, student_id').in('student_id', allStudentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Build lookup maps for O(1) access
    const profileMap: Record<string, { total_xp: number; last_active_at: string | null }> = {};
    for (const p of profilesResult.data || []) {
      profileMap[p.id] = { total_xp: p.total_xp, last_active_at: p.last_active_at };
    }

    // Group progress rows by student_id
    const progressByStudent: Record<string, { status: string; score: number | null }[]> = {};
    for (const row of progressResult.data || []) {
      if (!progressByStudent[row.student_id]) progressByStudent[row.student_id] = [];
      progressByStudent[row.student_id].push({ status: row.status, score: row.score });
    }

    // Compute per-class analytics from in-memory maps
    const classAnalytics: ClassAnalytics[] = [];
    for (const cls of classes) {
      const studentIds = classStudentMap[cls.id] || [];
      const studentCount = studentIds.length;
      let totalXP = 0;
      let activeStudents = 0;
      let completedNodes = 0;
      let totalNodes = 0;
      let totalScore = 0;
      let scoreCount = 0;

      for (const sid of studentIds) {
        const profile = profileMap[sid];
        if (profile) {
          totalXP += profile.total_xp || 0;
          if (profile.last_active_at && new Date(profile.last_active_at) > weekAgo) activeStudents++;
        }
        for (const prog of progressByStudent[sid] || []) {
          totalNodes++;
          if (prog.status === 'completed') completedNodes++;
          if (prog.score !== null && prog.score > 0) { totalScore += prog.score; scoreCount++; }
        }
      }

      classAnalytics.push({
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        schoolYear: cls.school_year,
        studentCount,
        averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        completionRate: totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0,
        totalXP,
        averageXP: studentCount > 0 ? totalXP / studentCount : 0,
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
      const classIds = [...new Set(assignments.map((a: any) => a.classes?.id).filter(Boolean))] as number[];
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
 * Escapes a CSV field by wrapping in double quotes when it contains
 * commas, double quotes, or newlines, and doubling any internal quotes.
 */
function escapeCSVField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
      escapeCSVField(c.className),
      escapeCSVField(c.grade.toString()),
      escapeCSVField(c.schoolYear),
      escapeCSVField(c.studentCount.toString()),
      escapeCSVField(c.averageScore.toFixed(2)),
      escapeCSVField(c.completionRate.toFixed(2)),
      escapeCSVField(c.activeStudents.toString()),
      escapeCSVField(activeRate),
      escapeCSVField(inactiveStudents.toString()),
      escapeCSVField(`${c.completedNodes}/${c.totalAssignedNodes}`),
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
    'Lớp chủ nhiệm',
    'Lớp bộ môn',
    'Tổng học sinh',
    'Môn giảng dạy',
    'Trạng thái',
    'Số ngày không hoạt động',
    'Lần cuối hoạt động',
  ];

  const rows = teachers.map((t) => {
    const activityText = t.activityStatus === 'active'
      ? 'Hoạt động'
      : t.activityStatus === 'inactive'
        ? 'Không hoạt động'
        : 'Chưa đăng nhập';
    const lastActiveText = t.lastActive
      ? new Date(t.lastActive).toLocaleDateString('vi-VN')
      : 'Chưa bao giờ';
    return [
      escapeCSVField(t.fullName || t.username || 'N/A'),
      escapeCSVField(t.email || 'N/A'),
      escapeCSVField(t.homeroomClasses.toString()),
      escapeCSVField(t.subjectClasses.toString()),
      escapeCSVField(t.totalStudents.toString()),
      escapeCSVField(t.subjects.join('; ') || 'Chưa có'),
      escapeCSVField(activityText),
      escapeCSVField(t.daysInactive.toString()),
      escapeCSVField(lastActiveText),
    ];
  });

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csv;
}

/**
 * Get analytics for classes taught by a specific teacher
 */
export async function getTeacherClassAnalytics(teacherId: string): Promise<{
  data: TeacherClassAnalytics | null;
  error: string | null;
}> {
  try {
    const supabase = getSupabaseBrowserClient();

    // 1. Get class IDs assigned to this teacher
    const { data: assignments, error: assignmentsError } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('teacher_id', teacherId);

    if (assignmentsError) {
      return { data: null, error: assignmentsError.message };
    }

    const assignedClassIds = assignments?.map((a: { class_id: number }) => a.class_id) || [];
    if (assignedClassIds.length === 0) {
      return {
        data: {
          classes: [],
          summary: {
            totalClasses: 0,
            totalStudents: 0,
            averageScore: 0,
            averageCompletion: 0
          }
        },
        error: null
      };
    }

    // 2. Get active classes from the assigned list
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name, grade, school_year')
      .in('id', assignedClassIds)
      .eq('status', 'active');

    if (classesError) {
      return { data: null, error: classesError.message };
    }

    // 3. --- BATCH QUERIES: Replace N+1 loop with 3 parallel batch queries ---
    const activeClasses = classes || [];
    const activeClassIds = activeClasses.map((c: { id: number }) => c.id);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Batch 1: All students across all assigned classes
    const { data: allClassStudents } = await supabase
      .from('class_students')
      .select('class_id, student_id')
      .in('class_id', activeClassIds)
      .eq('status', 'active');

    // Build map: classId -> studentIds
    const classStudentMap: Record<number, string[]> = {};
    for (const row of allClassStudents || []) {
      if (!classStudentMap[row.class_id]) classStudentMap[row.class_id] = [];
      classStudentMap[row.class_id].push(row.student_id);
    }

    const allStudentIds = [...new Set((allClassStudents || []).map((s: { student_id: string }) => s.student_id))];

    // Batch 2 & 3: Run in parallel
    const [profilesResult, progressResult] = await Promise.all([
      allStudentIds.length > 0
        ? supabase.from('profiles').select('id, total_xp, last_active_at').in('id', allStudentIds)
        : Promise.resolve({ data: [], error: null }),
      allStudentIds.length > 0
        ? supabase.from('student_node_progress').select('status, score, student_id').in('student_id', allStudentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const profileMap: Record<string, { total_xp: number; last_active_at: string | null }> = {};
    for (const p of profilesResult.data || []) {
      profileMap[p.id] = { total_xp: p.total_xp, last_active_at: p.last_active_at };
    }

    const progressByStudent: Record<string, { status: string; score: number | null }[]> = {};
    for (const row of progressResult.data || []) {
      if (!progressByStudent[row.student_id]) progressByStudent[row.student_id] = [];
      progressByStudent[row.student_id].push({ status: row.status, score: row.score });
    }

    // Compute per-class analytics from in-memory maps
    const classAnalytics: ClassAnalytics[] = [];
    for (const cls of activeClasses) {
      const studentIds = classStudentMap[cls.id] || [];
      if (studentIds.length === 0) continue;

      const studentCount = studentIds.length;
      let totalXP = 0, activeStudents = 0, completedNodes = 0, totalNodes = 0, totalScore = 0, scoreCount = 0;

      for (const sid of studentIds) {
        const profile = profileMap[sid];
        if (profile) {
          totalXP += profile.total_xp || 0;
          if (profile.last_active_at && new Date(profile.last_active_at) > weekAgo) activeStudents++;
        }
        for (const prog of progressByStudent[sid] || []) {
          totalNodes++;
          if (prog.status === 'completed') completedNodes++;
          if (prog.score) { totalScore += prog.score; scoreCount++; }
        }
      }

      classAnalytics.push({
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        schoolYear: cls.school_year,
        studentCount,
        averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        completionRate: totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0,
        totalXP,
        averageXP: studentCount > 0 ? totalXP / studentCount : 0,
        activeStudents,
        completedNodes,
        totalAssignedNodes: totalNodes,
      });
    }

    return {
      data: {
        classes: classAnalytics,
        summary: {
          totalClasses: classAnalytics.length,
          totalStudents: classAnalytics.reduce((sum, c) => sum + c.studentCount, 0),
          averageScore: classAnalytics.length > 0 ? classAnalytics.reduce((sum, c) => sum + c.averageScore, 0) / classAnalytics.length : 0,
          averageCompletion: classAnalytics.length > 0 ? classAnalytics.reduce((sum, c) => sum + c.completionRate, 0) / classAnalytics.length : 0,
        }
      },
      error: null
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Get detailed report card data for a specific student
 */
export async function getStudentReportData(studentId: string): Promise<{
  data: StudentReportData | null;
  error: string | null;
}> {
  try {
    const supabase = getSupabaseBrowserClient();

    // 1. Get profile basic info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, total_xp, level')
      .eq('id', studentId)
      .single();

    if (profileError) return { data: null, error: profileError.message };

    // 2. Get node progress
    const { data: nodeProgress } = await supabase
      .from('student_node_progress')
      .select(`
        node_id,
        status,
        completed_at,
        nodes (
          title
        )
      `)
      .eq('student_id', studentId);

    // 3. Get test submissions history
    const { data: testSubmissions } = await supabase
      .from('test_submissions')
      .select(`
        test_id,
        score,
        submitted_at,
        tests (
          title,
          type
        )
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    // Process nodes
    const nodeHistory = (nodeProgress || []).map((p: any) => ({
      nodeId: p.node_id,
      nodeTitle: p.nodes?.title || 'Unknown Node',
      status: p.status,
      completedAt: p.completed_at
    }));

    const completedNodes = nodeHistory.filter((n: { status: string }) => n.status === 'completed').length;
    const totalNodes = nodeHistory.length;

    // Process tests
    const testHistory = (testSubmissions || []).map((s: any) => ({
      testId: s.test_id,
      testTitle: s.tests?.title || 'Unknown Test',
      score: s.score,
      submittedAt: s.submitted_at,
      type: s.tests?.type || 'practice'
    }));

    const totalScore = testHistory.reduce((sum: number, t: { score: number }) => sum + t.score, 0);
    const averageScore = testHistory.length > 0 ? totalScore / testHistory.length : 0;

    return {
      data: {
        studentId: profile.id,
        fullName: profile.full_name,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        totalXP: profile.total_xp || 0,
        level: profile.level || 1,
        completedNodes,
        totalNodes,
        averageTestScore: averageScore,
        testHistory,
        nodeHistory
      },
      error: null
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
