import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for database tables
export interface Profile {
  id: string
  username: string
  role: 'student' | 'teacher'
  total_points: number
  created_at: string
  updated_at: string
}

export interface Node {
  id: string
  subject: 'math' | 'english' | 'vietnamese'
  title: string
  description: string
  required_points: number
  order: number
  created_at: string
  updated_at: string
}

export interface StudentProgress {
  id: string
  student_id: string
  node_id: string
  is_unlocked: boolean
  current_points: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Test {
  id: string
  node_id: string
  title: string
  questions: Question[]
  time_limit: number // in seconds
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  test_id: string
  question_text: string
  options: string[]
  correct_answer: number
  points: number
  created_at: string
}

export interface Battle {
  id: string
  student1_id: string
  student2_id: string
  student1_health: number
  student2_health: number
  current_question_id: string | null
  status: 'waiting' | 'active' | 'completed'
  winner_id: string | null
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  username: string
  total_points: number
  rank: number
  subject?: string
}