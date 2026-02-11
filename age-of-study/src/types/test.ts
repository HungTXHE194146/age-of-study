import { User } from '@supabase/supabase-js'

export type TestType = 'practice' | 'skill_check'
export type TestStatus = 'in_progress' | 'completed'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface Test {
  id: string
  title: string
  description: string
  type: TestType
  node_id: number | null
  settings: {
    time_limit: number
    allow_retry: boolean
  }
  is_published: boolean
  created_by: string
  created_at: string
}

export interface Question {
  id: string
  node_id: number | null
  content: {
    question: string
    options: string[]
  }
  correct_option_index: number
  difficulty: QuestionDifficulty
  status: string
  created_by: string | null
  created_at: string
}

export interface TestQuestion {
  test_id: string
  question_id: string
  points: number
  display_order: number
}

export interface TestSubmission {
  id: string
  test_id: string
  student_id: string
  score: number
  total_questions: number
  correct_answers: number
  started_at: string
  submitted_at: string | null
  status: TestStatus
}

export interface QuizAnswer {
  id: string
  submission_id: string
  question_id: string
  selected_option_index: number
  is_correct: boolean
  created_at: string
}

export interface TestWithQuestions extends Test {
  questions: (Question & { points: number; display_order: number })[]
}

export interface TestSubmissionWithAnswers extends TestSubmission {
  answers: QuizAnswer[]
}

export interface CreateTestRequest {
  title: string
  description: string
  type: TestType
  subject_id: number | null
  node_id: number | null
  settings: {
    time_limit: number
    allow_retry: boolean
  }
  is_published: boolean
  created_by: string
}

export interface AddQuestionsRequest {
  test_id: string
  question_ids: string[]
  points?: number
}

export interface SubmitTestRequest {
  test_id: string
  answers: {
    question_id: string
    selected_option_index: number
  }[]
}

export interface TestResult {
  submission: TestSubmission
  answers: QuizAnswer[]
  questions: Question[]
  score: number
  percentage: number
  totalQuestions: number
  correctAnswers: number
}