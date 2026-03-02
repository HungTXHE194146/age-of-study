/**
 * Class Management Types
 * Corresponds to migrations/add_class_system.sql
 */

import type { Subject } from './teacher';

// ============================================================================
// Database Table Types
// ============================================================================

export type ClassStatus = 'active' | 'archived'
export type StudentStatus = 'active' | 'transferred' | 'withdrawn'

/**
 * Classes table - Lớp học
 */
export interface Class {
  id: number
  name: string              // "Lớp 4A"
  grade: number             // 1-5 (tiểu học)
  school_year: string       // "2025-2026"
  class_code: string        // 8-character join code (case-sensitive)
  status: ClassStatus       // active | archived
  created_at: string        // ISO timestamp
  updated_at: string        // ISO timestamp
}

/**
 * Class_teachers table - Giáo viên ↔ Lớp
 * Supports both GVCN (homeroom) and GVBM (subject) teachers
 */
export interface ClassTeacher {
  id: number
  class_id: number
  teacher_id: string        // UUID from profiles
  subject_id: number        // GVCN can teach multiple subjects = multiple rows
  is_homeroom: boolean      // true = GVCN, false = GVBM
  created_at: string
}

/**
 * Class_students table - Học sinh ↔ Lớp
 */
export interface ClassStudent {
  class_id: number
  student_id: string        // UUID from profiles
  joined_at: string
  left_at: string | null    // When student transfers/withdraws
  status: StudentStatus     // active | transferred | withdrawn
}

// ============================================================================
// Populated/Joined Types (for frontend display)
// ============================================================================

/**
 * Teacher profile (minimal subset from profiles table)
 */
export interface TeacherProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

/**
 * Student profile (minimal subset from profiles table)
 */
export interface StudentProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  grade: number | null
  total_xp: number
}

// Subject type is imported from './teacher' (see top of file)

/**
 * Class with populated teacher information
 * Used in admin dashboard and teacher views
 */
export interface ClassWithTeachers extends Class {
  homeroom_teacher: (ClassTeacher & { 
    teacher: TeacherProfile
    subject: Subject
  })[]
  subject_teachers: (ClassTeacher & { 
    teacher: TeacherProfile
    subject: Subject
  })[]
}

/**
 * Class with student count (lightweight for lists)
 */
export interface ClassWithCount extends Class {
  student_count: number
  homeroom_teacher_name: string | null
}

/**
 * Student with class information
 * Used in admin user management
 */
export interface StudentWithClass extends StudentProfile {
  class?: {
    id: number
    name: string
    grade: number
    class_code: string
    school_year: string
    homeroom_teacher_name: string | null
  }
}

/**
 * Teacher with their assigned classes
 * Used in teacher dashboard
 */
export interface TeacherWithClasses extends TeacherProfile {
  homeroom_classes: (ClassWithCount & { subjects: Subject[] })[]
  subject_classes: (ClassWithCount & { subjects: Subject[] })[]
}

/**
 * Detailed class view with all students
 * Used in class detail page
 */
export interface ClassDetail extends Class {
  homeroom_teacher: {
    id: string
    full_name: string | null
    subjects: Subject[]
  } | null
  subject_teachers: {
    teacher: TeacherProfile
    subject: Subject
  }[]
  students: (ClassStudent & { 
    profile: StudentProfile
  })[]
}

// ============================================================================
// Form Input Types
// ============================================================================

/**
 * Create class form data
 */
export interface CreateClassInput {
  name: string
  grade: number
  school_year: string
  homeroom_teacher_id?: string
  subject_ids?: number[]  // For GVCN's subjects
}

/**
 * Assign teacher to class
 */
export interface AssignTeacherInput {
  class_id: number
  teacher_id: string
  subject_id: number
  is_homeroom: boolean
}

/**
 * Add student to class (via join code)
 */
export interface JoinClassInput {
  class_code: string
  student_id: string
}

/**
 * Transfer student to another class
 */
export interface TransferStudentInput {
  student_id: string
  from_class_id: number
  to_class_id: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ClassServiceResponse<T> {
  data: T | null
  error: string | null
}

export type ClassListResponse = ClassServiceResponse<ClassWithCount[]>
export type ClassDetailResponse = ClassServiceResponse<ClassDetail>
export type TeacherClassesResponse = ClassServiceResponse<TeacherWithClasses>
