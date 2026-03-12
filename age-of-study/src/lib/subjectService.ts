import { getSupabaseBrowserClient } from '@/lib/supabase'
import { Subject } from '@/types/teacher'

export class SubjectService {
  private supabase = getSupabaseBrowserClient()
  private _subjectsCache: Subject[] | null = null

  async getSubjects(): Promise<Subject[]> {
    // Return cached data if available
    if (this._subjectsCache) {
      return this._subjectsCache
    }

    try {
      const { data, error } = await this.supabase

        .from('subjects')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching subjects:', error)
        throw error
      }

      this._subjectsCache = data || []
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