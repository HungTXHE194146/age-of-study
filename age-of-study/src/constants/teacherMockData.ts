import { Question, Teacher, NavigationItem, Quiz } from '@/types/teacher'
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  Settings,
  Users,
  BookOpen,
  Brain,
  Trophy
} from 'lucide-react'

// Mock Teacher Data
export const mockTeacher: Teacher = {
  id: 'teacher-001',
  name: 'Ms. Anderson',
  email: 'anderson@school.edu',
  department: 'Science Dept.',
  avatar: '/api/placeholder/40/40'
}

// Mock Navigation Items
export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/teacher/dashboard',
    icon: LayoutDashboard,
    isActive: false
  },
  {
    id: 'my-quizzes',
    label: 'My Quizzes',
    href: '/teacher/quizzes',
    icon: FileText,
    isActive: true
  },
  {
    id: 'leaderboard',
    label: 'Bảng Xếp Hạng',
    href: '/teacher/leaderboard',
    icon: Trophy,
    isActive: false
  },
  {
    id: 'student-progress',
    label: 'Student Progress',
    href: '/teacher/progress',
    icon: GraduationCap,
    isActive: false
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/teacher/settings',
    icon: Settings,
    isActive: false
  }
]

// Mock Questions Data
export const mockQuestions: Question[] = [
  {
    id: 'q-001',
    number: 1,
    type: 'MULTIPLE_CHOICE',
    questionText: 'Which organelle is known as the "powerhouse" of the cell?',
    options: [
      {
        id: 'opt-001-a',
        label: 'A',
        text: 'Nucleus',
        isCorrect: false
      },
      {
        id: 'opt-001-b',
        label: 'B',
        text: 'Mitochondria',
        isCorrect: true
      },
      {
        id: 'opt-001-c',
        label: 'C',
        text: 'Ribosome',
        isCorrect: false
      },
      {
        id: 'opt-001-d',
        label: 'D',
        text: 'Endoplasmic Reticulum',
        isCorrect: false
      }
    ],
    difficulty: 'Easy',
    topic: 'Cell Biology',
    createdAt: Date.now()
  },
  {
    id: 'q-002',
    number: 2,
    type: 'MULTIPLE_CHOICE',
    questionText: 'What is the chemical symbol for water?',
    options: [
      {
        id: 'opt-002-a',
        label: 'A',
        text: 'H2O',
        isCorrect: true
      },
      {
        id: 'opt-002-b',
        label: 'B',
        text: 'CO2',
        isCorrect: false
      },
      {
        id: 'opt-002-c',
        label: 'C',
        text: 'O2',
        isCorrect: false
      },
      {
        id: 'opt-002-d',
        label: 'D',
        text: 'NaCl',
        isCorrect: false
      }
    ],
    difficulty: 'Easy',
    topic: 'Chemistry',
    createdAt: Date.now()
  },
  {
    id: 'q-003',
    number: 3,
    type: 'MULTIPLE_CHOICE',
    questionText: 'Which planet is known as the Red Planet?',
    options: [
      {
        id: 'opt-003-a',
        label: 'A',
        text: 'Venus',
        isCorrect: false
      },
      {
        id: 'opt-003-b',
        label: 'B',
        text: 'Mars',
        isCorrect: true
      },
      {
        id: 'opt-003-c',
        label: 'C',
        text: 'Jupiter',
        isCorrect: false
      },
      {
        id: 'opt-003-d',
        label: 'D',
        text: 'Saturn',
        isCorrect: false
      }
    ],
    difficulty: 'Easy',
    topic: 'Astronomy',
    createdAt: Date.now()
  },
  {
    id: 'q-004',
    number: 4,
    type: 'MULTIPLE_CHOICE',
    questionText: 'What process do plants use to convert sunlight into energy?',
    options: [
      {
        id: 'opt-004-a',
        label: 'A',
        text: 'Respiration',
        isCorrect: false
      },
      {
        id: 'opt-004-b',
        label: 'B',
        text: 'Photosynthesis',
        isCorrect: true
      },
      {
        id: 'opt-004-c',
        label: 'C',
        text: 'Digestion',
        isCorrect: false
      },
      {
        id: 'opt-004-d',
        label: 'D',
        text: 'Fermentation',
        isCorrect: false
      }
    ],
    difficulty: 'Medium',
    topic: 'Biology',
    createdAt: Date.now()
  },
  {
    id: 'q-005',
    number: 5,
    type: 'MULTIPLE_CHOICE',
    questionText: 'What is the largest organ in the human body?',
    options: [
      {
        id: 'opt-005-a',
        label: 'A',
        text: 'Liver',
        isCorrect: false
      },
      {
        id: 'opt-005-b',
        label: 'B',
        text: 'Skin',
        isCorrect: true
      },
      {
        id: 'opt-005-c',
        label: 'C',
        text: 'Heart',
        isCorrect: false
      },
      {
        id: 'opt-005-d',
        label: 'D',
        text: 'Brain',
        isCorrect: false
      }
    ],
    difficulty: 'Easy',
    topic: 'Human Anatomy',
    createdAt: Date.now()
  },
  {
    id: 'q-006',
    number: 6,
    type: 'MULTIPLE_CHOICE',
    questionText: 'Which gas do humans exhale?',
    options: [
      {
        id: 'opt-006-a',
        label: 'A',
        text: 'Oxygen',
        isCorrect: false
      },
      {
        id: 'opt-006-b',
        label: 'B',
        text: 'Carbon Dioxide',
        isCorrect: true
      },
      {
        id: 'opt-006-c',
        label: 'C',
        text: 'Nitrogen',
        isCorrect: false
      },
      {
        id: 'opt-006-d',
        label: 'D',
        text: 'Hydrogen',
        isCorrect: false
      }
    ],
    difficulty: 'Easy',
    topic: 'Respiration',
    createdAt: Date.now()
  }
]

// Mock Quiz Data
export const mockQuiz: Quiz = {
  id: 'quiz-001',
  title: 'Science Quiz - Cell Biology & Chemistry',
  subject: 'Science',
  difficulty: 'Mixed',
  questionCount: 6,
  questions: mockQuestions,
  createdAt: new Date('2024-01-15'),
  isPublished: false
}

// Mock Subject Options
export const subjectOptions = [
  { value: 'math', label: 'Toán Học' },
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'vietnamese', label: 'Tiếng Việt' },
  { value: 'science', label: 'Khoa Học' },
  { value: 'history', label: 'Lịch Sử' },
  { value: 'geography', label: 'Địa Lý' }
]

// Mock Difficulty Options
export const difficultyOptions = [
  { value: 'Easy', label: 'Dễ' },
  { value: 'Medium', label: 'Trung Bình' },
  { value: 'Hard', label: 'Khó' },
  { value: 'Mixed', label: 'Hỗn Hợp' }
]

// Mock Question Count Options
export const questionCountOptions = [
  { value: 5, label: '5 câu hỏi' },
  { value: 10, label: '10 câu hỏi' },
  { value: 15, label: '15 câu hỏi' },
  { value: 20, label: '20 câu hỏi' }
]

// Mock Sort Options
export const sortOptions = [
  { value: 'relevance', label: 'Độ liên quan' },
  { value: 'difficulty', label: 'Độ khó' },
  { value: 'date', label: 'Ngày tạo' }
]