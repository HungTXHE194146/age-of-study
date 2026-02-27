/**
 * Class Management Service
 * Handles all database operations for classes, teachers, and students
 */

import { getSupabaseBrowserClient } from './supabase';
import type {
  Class,
  ClassTeacher,
  ClassStudent,
  ClassWithTeachers,
  ClassWithCount,
  ClassDetail,
  TeacherWithClasses,
  StudentWithClass,
  CreateClassInput,
  AssignTeacherInput,
  JoinClassInput,
  TransferStudentInput,
  ClassServiceResponse,
  ClassListResponse,
  ClassDetailResponse,
  TeacherClassesResponse,
} from '@/types/class';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique 8-character class code (case-sensitive)
 * Format: Uppercase + numbers, avoiding ambiguous chars (0, O, I, l)
 */
function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Verify class code is unique
 */
async function isClassCodeUnique(code: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('classes')
    .select('id')
    .eq('class_code', code)
    .single();

  // PGRST116 = no rows found = unique code
  if (error?.code === 'PGRST116') {
    return true;
  }
  // If data exists, code is not unique
  if (data) {
    return false;
  }
  // Unexpected error - throw to surface it
  if (error) {
    throw new Error(`Database error checking class code: ${error.message}`);
  }
  return false;
}

/**
 * Generate unique class code with retry logic
 */
async function generateUniqueClassCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateClassCode();
    if (await isClassCodeUnique(code)) {
      return code;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique class code after 10 attempts');
}

// ============================================================================
// Class CRUD Operations
// ============================================================================

/**
 * Create new class (Admin only)
 * Automatically generates unique class_code
 * Optionally assigns homeroom teacher and their subjects
 */
export async function createClass(
  input: CreateClassInput
): Promise<ClassServiceResponse<Class>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Generate unique class code
    const classCode = await generateUniqueClassCode();

    // Create class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert({
        name: input.name,
        grade: input.grade,
        school_year: input.school_year,
        class_code: classCode,
        status: 'active',
      })
      .select()
      .single();

    if (classError) {
      console.error('Create class error:', classError);
      return { data: null, error: classError.message };
    }

    // Assign homeroom teacher if provided
    if (input.homeroom_teacher_id && input.subject_ids && input.subject_ids.length > 0) {
      const assignments = input.subject_ids.map((subject_id) => ({
        class_id: classData.id,
        teacher_id: input.homeroom_teacher_id!,
        subject_id,
        is_homeroom: true,
      }));

      const { error: assignError } = await supabase
        .from('class_teachers')
        .insert(assignments);

      if (assignError) {
        console.error('Assign homeroom teacher error:', assignError);
        // Class created successfully but teacher assignment failed
        // Return class data with warning in error field
        return { 
          data: classData, 
          error: `Class created but teacher assignment failed: ${assignError.message}` 
        };
      }
    }

    return { data: classData, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get all active classes with student count (Admin view)
 */
export async function getAllClasses(): Promise<ClassListResponse> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Get all active classes first
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('status', 'active')
      .order('grade', { ascending: true })
      .order('name', { ascending: true });

    if (classesError) {
      console.error('Get classes error:', classesError);
      return { data: null, error: classesError.message };
    }

    if (!classesData || classesData.length === 0) {
      return { data: [], error: null };
    }

    // Get all class IDs
    const classIds = classesData.map((c: any) => c.id);

    // Get student counts for all classes using aggregate
    let studentCounts: Record<number, number> = {};
    
    if (classIds.length > 0) {
      const { data: countsData, error: countsError } = await supabase
        .from('class_students')
        .select('class_id')
        .in('class_id', classIds)
        .eq('status', 'active');

      if (countsError) {
        console.error('Get students count error:', countsError);
      } else {
        // Count students per class
        studentCounts = (countsData || []).reduce((acc: Record<number, number>, s: any) => {
          acc[s.class_id] = (acc[s.class_id] || 0) + 1;
          return acc;
        }, {});
      }
    }

    // Get homeroom teachers for all classes
    const { data: teachersData, error: teachersError } = await supabase
      .from('class_teachers')
      .select(`
        class_id,
        is_homeroom,
        teacher:profiles!inner(id, full_name, username)
      `)
      .in('class_id', classIds)
      .eq('is_homeroom', true);

    if (teachersError) {
      console.error('Get homeroom teachers error:', teachersError);
    }

    // Map homeroom teachers by class_id
    const homeroomMap = (teachersData || []).reduce((acc: Record<number, string>, t: any) => {
      if (!acc[t.class_id]) {
        acc[t.class_id] = t.teacher.full_name || t.teacher.username;
      }
      return acc;
    }, {});

    // Transform to ClassWithCount
    const classes: ClassWithCount[] = classesData.map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      grade: cls.grade,
      school_year: cls.school_year,
      class_code: cls.class_code,
      status: cls.status,
      created_at: cls.created_at,
      updated_at: cls.updated_at,
      student_count: studentCounts[cls.id] || 0,
      homeroom_teacher_name: homeroomMap[cls.id] || null,
    }));

    return { data: classes, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('getAllClasses exception:', err);
    return { data: null, error: message };
  }
}

/**
 * Get class detail with all teachers and students (optimized with parallel queries)
 */
export async function getClassDetail(classId: number): Promise<ClassDetailResponse> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Execute all queries in parallel for better performance
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
            activity_logs (
              id, activity_type, description, created_at
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

    // Check for errors
    if (classResult.error) {
      console.error('Get class error:', classResult.error);
      return { data: null, error: classResult.error.message };
    }

    if (teachersResult.error) {
      console.error('Get class teachers error:', teachersResult.error);
      return { data: null, error: teachersResult.error.message };
    }

    if (studentsResult.error) {
      console.error('Get class students error:', studentsResult.error);
      return { data: null, error: studentsResult.error.message };
    }

    const classData = classResult.data;
    const teachersData = teachersResult.data || [];
    const studentsData = studentsResult.data || [];

    // Find homeroom teacher
    const homeroomTeachers = teachersData.filter((ct: any) => ct.is_homeroom);
    const homeroomTeacher = homeroomTeachers.length > 0 ? {
      id: homeroomTeachers[0].teacher.id,
      full_name: homeroomTeachers[0].teacher.full_name,
      subjects: homeroomTeachers.map((ct: any) => ct.subject),
    } : null;

    // Get subject teachers (not homeroom)
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
        // Find the latest activity
        let latestActivity = null;
        if (s.profile.activity_logs && s.profile.activity_logs.length > 0) {
          // Sort descending by created_at just to be safe
          const sortedActs = [...s.profile.activity_logs].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          latestActivity = sortedActs[0];
        }

        // Find the latest progress node
        let latestProgress = null;
        if (s.profile.student_node_progress && s.profile.student_node_progress.length > 0) {
          // Sort descending by last_accessed_at or completed_at
          const sortedProg = [...s.profile.student_node_progress].sort((a, b) => {
            const timeA = new Date(a.last_accessed_at || a.completed_at || 0).getTime();
            const timeB = new Date(b.last_accessed_at || b.completed_at || 0).getTime();
            return timeB - timeA;
          });
          latestProgress = sortedProg[0];
        }

        return {
          ...s,
          profile: {
            ...s.profile,
            latest_activity: latestActivity,
            latest_progress: latestProgress
          }
        };
      }),
    };

    console.log('Class detail loaded:', {
      classId,
      teachersCount: teachersData.length,
      homeroomTeacher: homeroomTeacher?.full_name || 'none',
      subjectTeachersCount: subjectTeachers.length,
      studentsCount: studentsData.length,
    });

    return { data: classDetail, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('getClassDetail exception:', err);
    return { data: null, error: message };
  }
}

/**
 * Get all subjects taught in a class
 * Returns unique subjects with their teachers
 */
export async function getClassSubjects(classId: number) {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from('class_teachers')
      .select(`
        subject_id,
        subject:subjects!inner(id, name),
        teacher:profiles!inner(id, full_name)
      `)
      .eq('class_id', classId);

    if (error) {
      console.error('Get class subjects error:', error);
      return { data: null, error: error.message };
    }

    // Group by subject to avoid duplicates
    const subjectMap = new Map();
    data?.forEach((item: any) => {
      const subjectId = item.subject.id;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          id: item.subject.id,
          name: item.subject.name,
          teachers: [],
        });
      }
      subjectMap.get(subjectId).teachers.push(item.teacher);
    });

    const subjects = Array.from(subjectMap.values());
    return { data: subjects, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('getClassSubjects exception:', err);
    return { data: null, error: message };
  }
}

// ============================================================================
// Teacher Operations
// ============================================================================

/**
 * Get all classes assigned to a teacher (both homeroom and subject)
 */
export async function getTeacherClasses(
  teacherId: string
): Promise<TeacherClassesResponse> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Get teacher profile
    const { data: teacherData, error: teacherError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', teacherId)
      .single();

    if (teacherError) {
      console.error('Get teacher error:', teacherError);
      return { data: null, error: teacherError.message };
    }

    // Get class assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('class_teachers')
      .select(`
        *,
        class:classes!inner(*),
        subject:subjects!inner(id, name)
      `)
      .eq('teacher_id', teacherId)
      .eq('class.status', 'active');

    if (assignmentsError) {
      console.error('Get teacher assignments error:', assignmentsError);
      return { data: null, error: assignmentsError.message };
    }

    // Get student counts for each class
    const classIds = Array.from(
      new Set(assignmentsData?.map((a: any) => a.class_id) || [])
    );
    
    let countMap = new Map<number, number>();
    
    if (classIds.length > 0) {
      const { data: countsData, error: countsError } = await supabase
        .from('class_students')
        .select('class_id')
        .in('class_id', classIds)
        .eq('status', 'active');

      if (countsError) {
        console.error('Get student counts error:', countsError);
        // Non-fatal, continue without counts
      } else {
        // Count students per class by grouping
        const counts = (countsData || []).reduce((acc: Record<number, number>, item: any) => {
          acc[item.class_id] = (acc[item.class_id] || 0) + 1;
          return acc;
        }, {});
        
        countMap = new Map<number, number>();
        for (const [key, value] of Object.entries(counts)) {
          countMap.set(Number(key), value as number);
        }
      }
    }

    // Separate homeroom and subject classes
    const homeroomClasses = (assignmentsData || [])
      .filter((a: any) => a.is_homeroom)
      .map((a: any) => ({
        ...a.class,
        student_count: countMap.get(a.class_id) || 0,
        homeroom_teacher_name: teacherData.full_name,
        subject: a.subject,
      }));

    const subjectClasses = (assignmentsData || [])
      .filter((a: any) => !a.is_homeroom)
      .map((a: any) => ({
        ...a.class,
        student_count: countMap.get(a.class_id) || 0,
        homeroom_teacher_name: null, // Could query this if needed
        subject: a.subject,
      }));

    const result: TeacherWithClasses = {
      ...teacherData,
      homeroom_classes: homeroomClasses,
      subject_classes: subjectClasses,
    };

    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Assign teacher to class for a specific subject
 */
export async function assignTeacherToClass(
  input: AssignTeacherInput
): Promise<ClassServiceResponse<ClassTeacher>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Check if assignment already exists
    const { data: existingData, error: existingError } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('class_id', input.class_id)
      .eq('teacher_id', input.teacher_id)
      .eq('subject_id', input.subject_id)
      .maybeSingle();

    // Handle network/permission/db errors (not PGRST116)
    if (existingError) {
      console.error('Check existing assignment error:', existingError);
      return { data: null, error: existingError.message };
    }

    if (existingData) {
      return { 
        data: null, 
        error: 'Teacher already assigned to this class for this subject' 
      };
    }

    const { data, error } = await supabase
      .from('class_teachers')
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error('Assign teacher error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Remove teacher from class (specific subject)
 */
export async function removeTeacherFromClass(
  classId: number,
  teacherId: string,
  subjectId: number
): Promise<ClassServiceResponse<boolean>> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase
      .from('class_teachers')
      .delete()
      .eq('class_id', classId)
      .eq('teacher_id', teacherId)
      .eq('subject_id', subjectId);

    if (error) {
      console.error('Remove teacher error:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

// ============================================================================
// Student Operations
// ============================================================================

/**
 * Get student's current active class
 */
export async function getStudentClass(
  studentId: string
): Promise<ClassServiceResponse<StudentWithClass>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Get student profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, grade, total_xp')
      .eq('id', studentId)
      .single();

    if (profileError) {
      console.error('Get student profile error:', profileError);
      return { data: null, error: profileError.message };
    }

    // Get active class membership
    const { data: classData, error: classError } = await supabase
      .from('class_students')
      .select(`
        class:classes!inner(
          id,
          name,
          grade,
          class_code,
          school_year,
          class_teachers!left(
            is_homeroom,
            teacher:profiles!inner(full_name)
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    if (classError && classError.code !== 'PGRST116') {
      console.error('Get student class error:', classError);
      return { data: null, error: classError.message };
    }

    // Student might not be in any class
    let classInfo = undefined;
    if (classData && classData.class) {
      const homeroomTeacher = (classData.class.class_teachers || [])
        .find((ct: any) => ct.is_homeroom === true);

      classInfo = {
        id: classData.class.id,
        name: classData.class.name,
        grade: classData.class.grade,
        class_code: classData.class.class_code,
        school_year: classData.class.school_year,
        homeroom_teacher_name: homeroomTeacher?.teacher?.full_name || null,
      };
    }

    const result: StudentWithClass = {
      ...profileData,
      class: classInfo,
    };

    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Add student to class via join code
 */
export async function joinClassByCode(
  input: JoinClassInput
): Promise<ClassServiceResponse<ClassStudent>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Find class by code
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('class_code', input.class_code)
      .eq('status', 'active')
      .single();

    if (classError || !classData) {
      return { data: null, error: 'Invalid or inactive class code' };
    }

    // Check if student already in another active class
    const { data: existingClass } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', input.student_id)
      .eq('status', 'active')
      .single();

    if (existingClass) {
      return { 
        data: null, 
        error: 'Student already belongs to an active class. Please transfer instead.' 
      };
    }

    // Add student to class
    const { data, error } = await supabase
      .from('class_students')
      .insert({
        class_id: classData.id,
        student_id: input.student_id,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Join class error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Add student to class directly (Admin only, bypasses join code)
 */
export async function addStudentToClass(
  classId: number,
  studentId: string
): Promise<ClassServiceResponse<ClassStudent>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Check if student already in another active class
    const { data: existingClass } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    if (existingClass) {
      return { 
        data: null, 
        error: 'Student already belongs to an active class. Use transfer instead.' 
      };
    }

    const { data, error } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id: studentId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Add student error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Transfer student from one class to another
 * Uses atomic operation to ensure both operations succeed or fail together
 */
export async function transferStudent(
  input: TransferStudentInput
): Promise<ClassServiceResponse<boolean>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Verify destination class exists and is active
    const { data: destClass, error: destError } = await supabase
      .from('classes')
      .select('id, status')
      .eq('id', input.to_class_id)
      .single();

    if (destError || !destClass) {
      return { data: null, error: 'Destination class not found' };
    }

    if (destClass.status !== 'active') {
      return { data: null, error: 'Destination class is not active' };
    }

    // Mark old class as transferred
    const { data: transferData, error: transferError } = await supabase
      .from('class_students')
      .update({
        status: 'transferred',
        left_at: new Date().toISOString(),
      })
      .eq('class_id', input.from_class_id)
      .eq('student_id', input.student_id)
      .select();

    if (transferError) {
      console.error('Transfer student (old class) error:', transferError);
      return { data: null, error: transferError.message };
    }

    // Check if any rows were updated
    if (!transferData || transferData.length === 0) {
      return { 
        data: null, 
        error: 'Student not found in source class or already transferred' 
      };
    }

    // Add to new class
    const { error: addError } = await supabase
      .from('class_students')
      .insert({
        class_id: input.to_class_id,
        student_id: input.student_id,
        status: 'active',
      });

    if (addError) {
      console.error('Transfer student (new class) error:', addError);
      
      // Attempt to rollback the old class status change
      const { error: rollbackError } = await supabase
        .from('class_students')
        .update({
          status: 'active',
          left_at: null,
        })
        .eq('class_id', input.from_class_id)
        .eq('student_id', input.student_id);

      if (rollbackError) {
        console.error('Failed to rollback transfer:', rollbackError);
        return { 
          data: null, 
          error: `Transfer failed and rollback failed. Manual intervention required: ${addError.message}` 
        };
      }
      
      return { data: null, error: addError.message };
    }

    return { data: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Remove student from class (withdraw)
 */
export async function removeStudentFromClass(
  classId: number,
  studentId: string
): Promise<ClassServiceResponse<boolean>> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase
      .from('class_students')
      .update({
        status: 'withdrawn',
        left_at: new Date().toISOString(),
      })
      .eq('class_id', classId)
      .eq('student_id', studentId);

    if (error) {
      console.error('Remove student error:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

// ============================================================================
// Class Lifecycle
// ============================================================================

/**
 * Archive class (at end of school year)
 */
export async function archiveClass(classId: number): Promise<ClassServiceResponse<boolean>> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase
      .from('classes')
      .update({ status: 'archived' })
      .eq('id', classId);

    if (error) {
      console.error('Archive class error:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get all archived classes
 */
export async function getArchivedClasses(): Promise<ClassListResponse> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Get all archived classes first
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('status', 'archived')
      .order('updated_at', { ascending: false });

    if (classesError) {
      console.error('Get archived classes error:', classesError);
      return { data: null, error: classesError.message };
    }

    if (!classesData || classesData.length === 0) {
      return { data: [], error: null };
    }

    const classIds = classesData.map((c: any) => c.id);

    // Get student counts for all classes
    const { data: studentsData, error: studentsError } = await supabase
      .from('class_students')
      .select('class_id')
      .in('class_id', classIds)
      .eq('status', 'active');

    if (studentsError) {
      console.error('Get students count error:', studentsError);
    }

    const studentCounts = (studentsData || []).reduce((acc: Record<number, number>, s: any) => {
      acc[s.class_id] = (acc[s.class_id] || 0) + 1;
      return acc;
    }, {});

    // Get homeroom teachers
    const { data: teachersData, error: teachersError } = await supabase
      .from('class_teachers')
      .select(`
        class_id,
        is_homeroom,
        teacher:profiles!inner(id, full_name, username)
      `)
      .in('class_id', classIds)
      .eq('is_homeroom', true);

    if (teachersError) {
      console.error('Get homeroom teachers error:', teachersError);
    }

    const homeroomMap = (teachersData || []).reduce((acc: Record<number, string>, t: any) => {
      if (!acc[t.class_id]) {
        acc[t.class_id] = t.teacher.full_name || t.teacher.username;
      }
      return acc;
    }, {});

    const classes: ClassWithCount[] = classesData.map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      grade: cls.grade,
      school_year: cls.school_year,
      class_code: cls.class_code,
      status: cls.status,
      created_at: cls.created_at,
      updated_at: cls.updated_at,
      student_count: studentCounts[cls.id] || 0,
      homeroom_teacher_name: homeroomMap[cls.id] || null,
    }));

    return { data: classes, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('getArchivedClasses exception:', err);
    return { data: null, error: message };
  }
}

/**
 * Restore an archived class
 */
export async function restoreClass(classId: number): Promise<ClassServiceResponse<boolean>> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase
      .from('classes')
      .update({ status: 'active' })
      .eq('id', classId);

    if (error) {
      console.error('Restore class error:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Update class information
 */
export async function updateClass(
  classId: number,
  updates: Partial<Pick<Class, 'name' | 'grade' | 'school_year'>>
): Promise<ClassServiceResponse<Class>> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', classId)
      .select()
      .single();

    if (error) {
      console.error('Update class error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}
