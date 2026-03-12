import { LucideIcon } from "lucide-react";

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Mixed";
export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "ESSAY"
  | "WORD_ORDERING"
  | "MATCHING"
  | "FILL_IN_BLANKS"
  | "CATEGORIZATION"
  | "FIND_ERROR";

export type QuestionDifficulty = "Easy" | "Medium" | "Hard";
export type SortOption = "relevance" | "difficulty" | "date";

export interface QuestionOption {
  id: string;
  label: string; // A, B, C, D hoặc text trong matching
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  createdAt: number;
  number: number;
  type: QuestionType;
  questionText: string;
  options: QuestionOption[];
  difficulty: QuestionDifficulty;
  points?: number;
  explanation?: string;
  model_answer?: string;
  // Cấu trúc bổ sung cho các loại câu hỏi mới
  metadata?: {
    orderedWords?: string[]; // Cho WORD_ORDERING: danh sách từ theo đúng thứ tự
    matchingPairs?: Array<{ left: string; right: string }>; // Cho MATCHING: các cặp nối đúng
    blanks?: Array<{ index: number; answer: string }>; // Cho FILL_IN_BLANKS: vị trí và đáp án đúng
    categories?: Array<{ name: string; items: string[] }>; // Cho CATEGORIZATION: các nhóm và từ thuộc nhóm đó
    errorPosition?: {
      startIndex: number;
      endIndex: number;
      correctText: string;
    }; // Cho FIND_ERROR

  };
}


export interface Quiz {
  id: string;
  title: string;
  subject: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  questions: Question[];
  createdAt: Date;
  isPublished: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
}

/**
 * Subject type matching database schema
 * Table: subjects
 */
export interface Subject {
  id: number;
  name: string;
  code: string;
  grade_level: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratorFormState {
  topic: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  subject?: string;
  file?: File | null;
  onlyFromFile: boolean;
  fromKnowledgeBase: boolean;
  fromQuestionBank: boolean;
  questionTypes: QuestionType[];
  action: "append" | "replace" | "edit";
}
