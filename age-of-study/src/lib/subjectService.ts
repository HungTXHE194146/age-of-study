import { createBrowserClient } from '@supabase/ssr'
import { Subject } from '@/types/teacher'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export class SubjectService {
  private supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  async getSubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await this.supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching subjects:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
      return []
    }
  }

  async getSubjectsByGrade(gradeLevel: string): Promise<Subject[]> {
    try {
      const { data, error } = await this.supabase
        .from('subjects')
        .select('*')
        .eq('grade_level', gradeLevel)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching subjects by grade:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch subjects by grade:', error)
      return []
    }
  }

  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      const { data, error } = await this.supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching subject by ID:', error)
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Failed to fetch subject by ID:', error)
      return null
    }
  }
}

// Export singleton instance
export const subjectService = new SubjectService()