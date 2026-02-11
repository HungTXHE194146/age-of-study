import { LucideIcon } from 'lucide-react'

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Mixed'
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY'
export type SortOption = 'relevance' | 'difficulty' | 'date'

export interface QuestionOption {
  id: string
  label: string // A, B, C, D
  text: string
  isCorrect: boolean
}

export interface Question {
  createdAt: number
  id: string
  number: number
  type: QuestionType
  questionText: string
  options: QuestionOption[]
  difficulty: DifficultyLevel
  topic: string
}

export interface Quiz {
  id: string
  title: string
  subject: string
  difficulty: DifficultyLevel
  questionCount: number
  questions: Question[]
  createdAt: Date
  isPublished: boolean
}

export interface Teacher {
  id: string
  name: string
  email: string
  department: string
  avatar: string
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  isActive?: boolean
}

export interface Subject {
  id: string
  name: string
  code: string
  grade_level: string
  description?: string
  created_at: string
  updated_at: string
}

export interface GeneratorFormState {
  topic: string
  difficulty: DifficultyLevel
  questionCount: number
  subject?: string
  file?: File | null
}
