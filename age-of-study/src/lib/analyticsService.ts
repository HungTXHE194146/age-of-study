/**
 * Analytics Service
 * Handles statistical analysis for classes, students, and teachers
 */

import { getSupabaseBrowserClient } from './supabase';

const CHUNK_SIZE = 100;
const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

const parseGrade = (gl: string | number | null): number => {
  if (gl === null || gl === undefined) return 5; // Default fallback
  if (typeof gl === 'number') return gl;
  const match = gl.toString().match(/\d+/);
  return match ? parseInt(match[0]) : 5;
};

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
  curriculumNodes: number;
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
    averageParticipation: number;
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
  recentActivity: {
    id: string;
    type: string;
    description: string;
    xpEarned: number;
    createdAt: string;
  }[];
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
            averageParticipation: 0,
            highestPerformingClass: null,
            lowestPerformingClass: null,
          },
        },
        error: null,
      };
    }

    // 1. Fetch subjects and node counts to calculate true curriculum progress
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, grade_level');
    
    if (subjectsError) return { data: null, error: subjectsError.message };

    const gradeTotalNodesMap = new Map<number, number>();
    const uniqueGrades: number[] = Array.from(new Set((subjectsData || []).map((s: { grade_level: string }) => parseGrade(s.grade_level))));

    for (const g of uniqueGrades) {
      const subjectIds = (subjectsData || [])
        .filter((s: { grade_level: string; id: number }) => parseGrade(s.grade_level) === g)
        .map((s: { id: number }) => s.id);
      
      if (subjectIds.length > 0) {
        const { count, error: countError } = await supabase
          .from('nodes')
          .select('*', { count: 'exact', head: true })
          .in('subject_id', subjectIds)
          .in('node_type', ['lesson', 'content']);
        
        if (countError) console.error(`Error counting nodes for grade ${g}:`, countError);
        gradeTotalNodesMap.set(g, (count as number) || 0);
      } else {
        gradeTotalNodesMap.set(g, 0);
      }
    }

    // 2. Fetch class students in chunks
    const classAnalytics: ClassAnalytics[] = [];
    const classIds = classes.map((cls: { id: number }) => cls.id);
    const classStudentMap = new Map<number, string[]>();
    const allStudentIds = new Set<string>();

    const classIdChunks = chunkArray(classIds, CHUNK_SIZE);
    for (const chunk of classIdChunks) {
      const { data: chunkStudents, error: classStudentsError } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', chunk)
        .eq('status', 'active');

      if (classStudentsError) {
        return { data: null, error: classStudentsError.message };
      }

      for (const row of chunkStudents || []) {
        const existing = classStudentMap.get(row.class_id) || [];
        existing.push(row.student_id);
        classStudentMap.set(row.class_id, existing);
        allStudentIds.add(row.student_id);
      }
    }

    const studentIds = Array.from(allStudentIds);
    const profileMap = new Map<string, { total_xp: number | null; last_active_at: string | null }>();
    const progressByStudent = new Map<string, { status: string; score: number | null }[]>();

    if (studentIds.length > 0) {
      const studentIdChunks = chunkArray(studentIds, CHUNK_SIZE);
      
      for (const chunk of studentIdChunks) {
        // 3. Fetch profiles in chunks
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, total_xp, last_active_at')
          .in('id', chunk);

        if (profilesError) {
          return { data: null, error: profilesError.message };
        }

        for (const profile of profiles || []) {
          profileMap.set(profile.id, {
            total_xp: profile.total_xp,
            last_active_at: profile.last_active_at,
          });
        }

        // 4. Fetch progress in chunks
        const { data: pd, error: pe } = await supabase
          .from('student_node_progress')
          .select('status, score, student_id')
          .in('student_id', chunk);

        if (pe) {
          console.error('Error fetching student_node_progress chunk:', pe.message);
          return { data: null, error: pe.message };
        }

        if (pd) {
          for (const progress of pd) {
            const existing = progressByStudent.get(progress.student_id) || [];
            // Cast score to number safely since it's stored as TEXT in DB
            const numericScore = progress.score ? Number(progress.score) : null;
            existing.push({ status: progress.status, score: numericScore });
            progressByStudent.set(progress.student_id, existing);
          }
        }
      }
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const cls of classes) {
      const studentIds = classStudentMap.get(cls.id) || [];
      const studentCount = studentIds.length;
      let totalXP = 0;
      let activeStudents = 0;
      let totalCompletedNodesInClass = 0;
      let totalScore = 0;
      let scoreCount = 0;

      // Get curriculum baseline for this class
      const gradeNum = parseGrade(cls.grade);
      const totalCurriculumNodesPerStudent = gradeTotalNodesMap.get(gradeNum) || 1; // avoid div by 0

      for (const studentId of studentIds) {
        const profile = profileMap.get(studentId);
        if (profile) {
          totalXP += profile.total_xp || 0;
          if (profile.last_active_at && new Date(profile.last_active_at) > weekAgo) {
            activeStudents++;
          }
        }

        const studentProgress = progressByStudent.get(studentId) || [];
        for (const progress of studentProgress) {
          if (progress.status === 'completed') {
            totalCompletedNodesInClass++;
          }
          // Only count scores that are valid percentages (0-100)
          if (progress.score !== null && progress.score > 0) {
            // Cap score at 100 for legacy data cleanup in view
            const cleanScore = Math.min(100, progress.score);
            totalScore += cleanScore;
            scoreCount++;
          }
        }
      }

      const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;
      
      // True Completion Rate: progress against the FULL curriculum
      const totalPossibleCompletions = totalCurriculumNodesPerStudent * studentCount;
      const completionRate = totalPossibleCompletions > 0 
        ? (totalCompletedNodesInClass / totalPossibleCompletions) * 100 
        : 0;
      
      const averageXP = studentCount > 0 ? totalXP / studentCount : 0;

      classAnalytics.push({
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        schoolYear: cls.school_year,
        studentCount,
        averageScore,
        completionRate: Math.min(100, completionRate), // Cap at 100%
        totalXP,
        averageXP,
        activeStudents,
        completedNodes: totalCompletedNodesInClass,
        totalAssignedNodes: totalPossibleCompletions,
        curriculumNodes: totalCurriculumNodesPerStudent,
      });
    }

    // Calculate summary statistics
    const totalStudents = classAnalytics.reduce((sum: number, c: ClassAnalytics) => sum + c.studentCount, 0);
    const avgScore =
      classAnalytics.length > 0
        ? classAnalytics.reduce((sum: number, c: ClassAnalytics) => sum + c.averageScore, 0) / classAnalytics.length
        : 0;
    const avgCompletion =
      classAnalytics.length > 0
        ? classAnalytics.reduce((sum: number, c: ClassAnalytics) => sum + c.completionRate, 0) / classAnalytics.length
        : 0;

    // Find highest and lowest performing classes
    let highestClass = null;
    let lowestClass = null;
    if (classAnalytics.length > 0) {
      // Best class = High score + High participation
      const sorted = [...classAnalytics].sort((a, b) => b.averageScore - a.averageScore);
      highestClass = sorted[0].className;
      lowestClass = sorted[sorted.length - 1].className;
    }

    const avgParticipation =
      totalStudents > 0
        ? (classAnalytics.reduce((sum: number, c: ClassAnalytics) => sum + (c.activeStudents || 0), 0) / totalStudents) * 100
        : 0;

    return {
      data: {
        classes: classAnalytics,
        summary: {
          totalClasses: classAnalytics.length,
          totalStudents,
          averageScore: avgScore,
          averageCompletion: avgCompletion,
          averageParticipation: avgParticipation,
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

    // Pre-calculate assignments by teacher_id (M-9 O(1) lookup)
    const assignmentsByTeacher = new Map<string, any[]>();
    for (const a of classAssignments || []) {
      const arr = assignmentsByTeacher.get(a.teacher_id) || [];
      arr.push(a);
      assignmentsByTeacher.set(a.teacher_id, arr);
    }

    for (const teacher of teachers) {
      // Get class assignments for this teacher using Map
      const assignments = assignmentsByTeacher.get(teacher.id) || [];
      const homeroomCount = assignments.filter((a: any) => a.is_homeroom).length;
      const subjectCount = assignments.filter((a: any) => !a.is_homeroom).length;
      const totalClasses = assignments.length;

      // Calculate total students
      const classIds = assignments.reduce((ids: number[], assignment: any) => {
        const classId = assignment.classes?.id;
        if (typeof classId === 'number' && !ids.includes(classId)) {
          ids.push(classId);
        }
        return ids;
      }, []);
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
    'Tổng lớp',
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
      escapeCSVField(t.totalClasses.toString()),
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

    // 3. Get analytics for each class using batched queries
    const classAnalytics: ClassAnalytics[] = [];
    const activeClasses = classes || [];
    const classIds = activeClasses.map((cls: { id: number }) => cls.id);
    const classStudentMap = new Map<number, string[]>();
    const allStudentIds = new Set<string>();

    // Fetch curriculum metadata
    const { data: subjectsData } = await supabase.from('subjects').select('id, grade_level');
    const { data: nodeCountsData } = await supabase.from('nodes').select('subject_id, node_type').in('node_type', ['lesson', 'content']);
    
    const subjectNodeCountMap = new Map<number, number>();
    for (const node of nodeCountsData || []) {
      subjectNodeCountMap.set(node.subject_id, (subjectNodeCountMap.get(node.subject_id) || 0) + 1);
    }
    const gradeTotalNodesMap = new Map<number, number>();
    for (const sub of subjectsData || []) {
      const grade = parseGrade(sub.grade_level);
      gradeTotalNodesMap.set(grade, (gradeTotalNodesMap.get(grade) || 0) + (subjectNodeCountMap.get(sub.id) || 0));
    }

    if (classIds.length > 0) {
      const { data: classStudents, error: classStudentsError } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds)
        .eq('status', 'active');

      if (classStudentsError) {
        return { data: null, error: classStudentsError.message };
      }

      for (const row of classStudents || []) {
        const studentIds = classStudentMap.get(row.class_id) || [];
        studentIds.push(row.student_id);
        classStudentMap.set(row.class_id, studentIds);
        allStudentIds.add(row.student_id);
      }
    }

    const profileMap = new Map<string, { total_xp: number | null; last_active_at: string | null }>();
    const progressByStudent = new Map<string, { status: string; score: number | null }[]>();

    if (allStudentIds.size > 0) {
      const studentIdList = Array.from(allStudentIds);

      const studentIdChunks = chunkArray(studentIdList, CHUNK_SIZE);
      
      for (const chunk of studentIdChunks) {
        // Fetch profiles in chunks
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, total_xp, last_active_at')
          .in('id', chunk);

        if (profilesError) {
          return { data: null, error: profilesError.message };
        }

        for (const profile of profiles || []) {
          profileMap.set(profile.id, {
            total_xp: profile.total_xp,
            last_active_at: profile.last_active_at,
          });
        }

        // Fetch progress in chunks
        const { data: pd, error: progressError } = await supabase
          .from('student_node_progress')
          .select('status, score, student_id')
          .in('student_id', chunk);

        if (progressError) {
          return { data: null, error: progressError.message };
        }

        for (const progress of pd || []) {
          const studentProgress = progressByStudent.get(progress.student_id) || [];
          // Cast score to number safely since it's stored as TEXT in DB
          const numericScore = progress.score ? Number(progress.score) : null;
          studentProgress.push({ status: progress.status, score: numericScore });
          progressByStudent.set(progress.student_id, studentProgress);
        }
      }
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const cls of activeClasses) {
      const studentIds = classStudentMap.get(cls.id) || [];
      const studentCount = studentIds.length;
      let totalXP = 0;
      let activeStudents = 0;
      let totalCompletedNodesInClass = 0;
      let totalScore = 0;
      let scoreCount = 0;

      const gradeNum = parseGrade(cls.grade);
      const totalCurriculumNodesPerStudent = gradeTotalNodesMap.get(gradeNum) || 1;

      for (const studentId of studentIds) {
        const profile = profileMap.get(studentId);
        if (profile) {
          totalXP += profile.total_xp || 0;
          if (profile.last_active_at && new Date(profile.last_active_at) > weekAgo) {
            activeStudents++;
          }
        }

        const pd = progressByStudent.get(studentId) || [];
        pd.forEach((p: { status: string; score: number | null }) => {
          if (p.status === 'completed') totalCompletedNodesInClass++;
          if (p.score !== null && p.score > 0) {
            const cleanScore = Math.min(100, p.score);
            totalScore += cleanScore;
            scoreCount++;
          }
        });
      }

      const totalPossibleCompletions = totalCurriculumNodesPerStudent * studentCount;
      const completionRate = totalPossibleCompletions > 0 
        ? (totalCompletedNodesInClass / totalPossibleCompletions) * 100 
        : 0;

      classAnalytics.push({
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        schoolYear: cls.school_year,
        studentCount,
        averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        completionRate: Math.min(100, completionRate),
        totalXP,
        averageXP: studentCount > 0 ? totalXP / studentCount : 0,
        activeStudents,
        completedNodes: totalCompletedNodesInClass,
        totalAssignedNodes: totalPossibleCompletions,
        curriculumNodes: totalCurriculumNodesPerStudent,
      });
    }

    return {
      data: {
        classes: classAnalytics,
        summary: {
          totalClasses: classAnalytics.length,
          totalStudents: classAnalytics.reduce((sum: number, c: ClassAnalytics) => sum + c.studentCount, 0),
          averageScore: classAnalytics.length > 0 ? classAnalytics.reduce((sum: number, c: ClassAnalytics) => sum + c.averageScore, 0) / classAnalytics.length : 0,
          averageCompletion: classAnalytics.length > 0 ? classAnalytics.reduce((sum: number, c: ClassAnalytics) => sum + c.completionRate, 0) / classAnalytics.length : 0,
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

    // 1. Get profile and class grade
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, total_xp, classes!inner(grade)')
      .eq('id', studentId)
      .single();

    if (profileError) return { data: null, error: profileError.message };

    const rawGrade = (profile.classes as any)?.grade;
    const grade = parseGrade(rawGrade);

    // 2. Fetch curriculum total for this grade
    const { data: subjectsData } = await supabase.from('subjects').select('id').eq('grade_level', grade.toString());
    const subjectIds = subjectsData?.map((s: { id: number }) => s.id) || [];
    
    let totalCurriculumNodes = 0;
    if (subjectIds.length > 0) {
      const { count } = await supabase
        .from('nodes')
        .select('id', { count: 'exact', head: true })
        .in('subject_id', subjectIds)
        .in('node_type', ['lesson', 'content']);
      
      totalCurriculumNodes = count || 0;
    }

    // 3. Fetch activity log
    const { data: activities, error: activityError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20);

    // 4. Fetch test history
    const { data: submissions } = await supabase
      .from('test_submissions')
      .select('*, tests(title)')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('submitted_at', { ascending: false });

    // 5. Fetch node progress
    const { data: studentProgress } = await supabase
      .from('student_node_progress')
      .select('*, nodes(title)')
      .eq('student_id', studentId);

    const completedNodes = (studentProgress || []).filter((p: { status: string }) => p.status === 'completed').length;
    const testScores = (submissions || [])
      .map((s: any) => s.score ? Number(s.score) : 0)
      .filter((s: number) => s > 0);
    
    const averageTestScore = testScores.length > 0 
      ? testScores.reduce((sum: number, s: number) => sum + s, 0) / testScores.length 
      : 0;

    const reportData: StudentReportData = {
      studentId: profile.id,
      fullName: profile.full_name,
      username: profile.username,
      avatarUrl: profile.avatar_url,
      totalXP: profile.total_xp || 0,
      level: Math.floor((profile.total_xp || 0) / 100) + 1,
      totalNodes: totalCurriculumNodes || studentProgress?.length || 0,
      completedNodes,
      averageTestScore,
      recentActivity: (activities || []).map((a: any) => ({
        id: a.id,
        type: a.activity_type,
        description: a.description,
        xpEarned: a.xp_earned,
        createdAt: a.created_at,
      })),
      testHistory: (submissions || []).map((s: any) => ({
        testId: s.test_id,
        testTitle: s.tests?.title || 'Bài tập',
        score: s.score ? Number(s.score) : 0,
        submittedAt: s.submitted_at,
        type: s.score >= 50 ? 'pass' : 'fail',
      })),
      nodeHistory: (studentProgress || []).map((p: any) => ({
        nodeId: p.node_id.toString(),
        nodeTitle: p.nodes?.title || 'Bài học',
        status: p.status,
        completedAt: p.completed_at,
      })),
    };

    return { data: reportData, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
