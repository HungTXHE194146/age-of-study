import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton instance for browser client
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Browser client with SSR support - use this in client components
// Using singleton pattern to avoid "Multiple GoTrueClient instances" warning
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

// @deprecated Use getSupabaseBrowserClient() instead to avoid multiple client instances
// Original client kept for backward compatibility only
export const supabase = getSupabaseBrowserClient()

// Type definitions for database tables
export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'system_admin' | 'teacher' | 'student'
  
  // Student profile fields
  age: number | null
  grade: number | null
  favorite_subject: string | null
  
  // Gamification core
  total_xp: number
  weekly_xp: number
  monthly_xp: number  // XP earned this month (reset monthly)
  current_streak: number
  last_study_date: string | null
  freeze_count: number
  
  // Safety
  daily_limit_minutes: number
  is_blocked: boolean  // Admin can block users
  
  // Profile completion tracking
  profile_completed_reward_claimed: boolean
  
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
  parent_node_id: string | null
  source_position: 'top' | 'bottom' | 'left' | 'right' | null
  target_position: 'top' | 'bottom' | 'left' | 'right' | null
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