import { type Node as NodeType, type Question } from '@/lib/supabase'

// Math Skill Tree for Grade 1
export const mathSkillTree: NodeType[] = [
  {
    id: 'math-1-1',
    subject: 'math',
    title: 'Số đếm 1-10',
    description: 'Học cách đếm và nhận biết các số từ 1 đến 10',
    required_points: 0,
    order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'math-1-2',
    subject: 'math',
    title: 'Cộng trừ trong phạm vi 5',
    description: 'Thực hiện các phép cộng và trừ đơn giản trong phạm vi 5',
    required_points: 10,
    order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'math-1-3',
    subject: 'math',
    title: 'Số đếm 1-20',
    description: 'Mở rộng phạm vi đếm lên đến 20',
    required_points: 20,
    order: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'math-1-4',
    subject: 'math',
    title: 'Cộng trừ trong phạm vi 10',
    description: 'Thực hiện các phép cộng và trừ trong phạm vi 10',
    required_points: 30,
    order: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'math-1-5',
    subject: 'math',
    title: 'Hình học cơ bản',
    description: 'Nhận biết các hình vuông, tròn, tam giác',
    required_points: 40,
    order: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'math-1-6',
    subject: 'math',
    title: 'So sánh số',
    description: 'Học cách so sánh lớn hơn, nhỏ hơn, bằng nhau',
    required_points: 50,
    order: 6,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// English Skill Tree for Grade 1
export const englishSkillTree: NodeType[] = [
  {
    id: 'english-1-1',
    subject: 'english',
    title: 'Alphabet A-M',
    description: 'Learn letters A through M and their sounds',
    required_points: 0,
    order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'english-1-2',
    subject: 'english',
    title: 'Alphabet N-Z',
    description: 'Learn letters N through Z and their sounds',
    required_points: 10,
    order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'english-1-3',
    subject: 'english',
    title: 'Basic Colors',
    description: 'Learn to identify and name basic colors',
    required_points: 20,
    order: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'english-1-4',
    subject: 'english',
    title: 'Numbers 1-10',
    description: 'Count and recognize numbers in English',
    required_points: 30,
    order: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'english-1-5',
    subject: 'english',
    title: 'Simple Words',
    description: 'Learn basic vocabulary words',
    required_points: 40,
    order: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Vietnamese Skill Tree for Grade 1
export const vietnameseSkillTree: NodeType[] = [
  {
    id: 'vietnamese-1-1',
    subject: 'vietnamese',
    title: 'Chữ cái A-M',
    description: 'Học các chữ cái từ A đến M',
    required_points: 0,
    order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'vietnamese-1-2',
    subject: 'vietnamese',
    title: 'Chữ cái N-Z',
    description: 'Học các chữ cái từ N đến Z',
    required_points: 10,
    order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'vietnamese-1-3',
    subject: 'vietnamese',
    title: 'Tô chữ cơ bản',
    description: 'Luyện viết các chữ cái cơ bản',
    required_points: 20,
    order: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'vietnamese-1-4',
    subject: 'vietnamese',
    title: 'Từ đơn giản',
    description: 'Học các từ vựng đơn giản hàng ngày',
    required_points: 30,
    order: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Sample questions for Math Node 1
export const mathQuestions: Question[] = [
  {
    id: 'q1',
    test_id: 'math-1-1',
    question_text: 'Số nào đứng sau số 5?',
    options: ['4', '6', '7', '8'],
    correct_answer: 1,
    points: 10,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'q2',
    test_id: 'math-1-1',
    question_text: 'Số nào đứng trước số 3?',
    options: ['1', '2', '4', '5'],
    correct_answer: 1,
    points: 10,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'q3',
    test_id: 'math-1-1',
    question_text: 'Có bao nhiêu ngón tay trên một bàn tay?',
    options: ['3', '4', '5', '6'],
    correct_answer: 2,
    points: 10,
    created_at: '2024-01-01T00:00:00Z'
  }
]

// Sample questions for English Node 1
export const englishQuestions: Question[] = [
  {
    id: 'eq1',
    test_id: 'english-1-1',
    question_text: 'What letter comes after A?',
    options: ['B', 'C', 'D', 'E'],
    correct_answer: 0,
    points: 10,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'eq2',
    test_id: 'english-1-1',
    question_text: 'What letter comes before C?',
    options: ['A', 'B', 'D', 'E'],
    correct_answer: 1,
    points: 10,
    created_at: '2024-01-01T00:00:00Z'
  }
]

// Sample questions for Vietnamese Node 1
export const vietnameseQuestions: Question[] = [
  {
    id: 'vq1',
    test_id: 'vietnamese-1-1',
    question_text: 'Chữ cái nào đứng sau chữ A?',
    options: ['B', 'C', 'D', 'E'],
    correct_answer: 0,
    points: 10,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'vq2',
    test_id: 'vietnamese-1-1',
    question_text: 'Chữ cái nào đứng trước chữ C?',
    options: ['A', 'B', 'D', 'E'],
    correct_answer: 1,
    points: 10,
    created_at: '2024-01-01T00:00:00Z'
  }
]

export const allSkillTrees = {
  math: mathSkillTree,
  english: englishSkillTree,
  vietnamese: vietnameseSkillTree
}

// Re-export Node type for components
export type { NodeType as Node }

export const allQuestions = {
  math: mathQuestions,
  english: englishQuestions,
  vietnamese: vietnameseQuestions
}