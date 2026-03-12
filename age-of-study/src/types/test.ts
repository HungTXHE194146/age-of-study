import { User } from "@supabase/supabase-js";

export type TestType = "practice" | "skill_check" | "homework" | "review" | "node_exercise" | "exam";
export type TestStatus = "in_progress" | "completed";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Test {
  id: string;
  title: string;
  description: string;
  type: TestType;
  subject_id: number | null;
  node_id: number | null;
  settings: {
    time_limit: number;
    allow_retry: boolean;
  };
  is_published: boolean;
  created_by: string;
  created_at: string;
  subject_name?: string;
  max_xp?: number;
  class_id?: number | null;
}

export interface QuestionOption {
  text: string;
  label: string;
  isCorrect: boolean;
}

export interface QuestionContent {
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'WORD_ORDERING' | 'MATCHING' | 'FILL_IN_BLANKS' | 'CATEGORIZATION' | 'FIND_ERROR';

  options: QuestionOption[] | string[];
  difficulty: string;
  explanation?: string;
  questionText: string;
  question: string;
  passage?: string | null;          // Trích đoạn 2-3 câu (comprehension questions)
  question_type?: 'comprehension' | 'grammar' | 'vocabulary';
  metadata?: {
    orderedWords?: string[];
    matchingPairs?: Array<{ left: string; right: string }>;
    blanks?: Array<{ index: number; answer: string }>;
    categories?: Array<{ name: string; items: string[] }>;
    errorPosition?: {
      startIndex: number;
      endIndex: number;
      correctText: string;
    };

  };
}


export interface Question {
  id: string;
  node_id: number | null;
  content: QuestionContent;
  correct_option_index: number;
  difficulty: QuestionDifficulty;
  status: string;
  created_by: string | null;
  created_at: string;
  q_type: string;
  model_answer: string;
  subject_id: number | null;
  explanation: string | null;
  embedding: number[] | null;
  tags: string[];
  source_document_id: string | null;
  updated_at: string;
}

export interface TestQuestion {
  test_id: string;
  question_id: string;
  points: number;
  display_order: number;
}

export interface TestSubmission {
  id: string;
  test_id: string;
  student_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  started_at: string;
  submitted_at: string | null;
  status: TestStatus;
}

export interface QuizAnswer {
  id?: string;
  submission_id: string;
  question_id: string;
  selected_option_index?: number;
  text_answer?: string;
  is_correct: boolean;
  created_at?: string;
}

export interface TestWithQuestions extends Test {
  questions: (Question & { points: number; display_order: number })[];
}

export interface TestSubmissionWithAnswers extends TestSubmission {
  answers: QuizAnswer[];
}

export interface CreateTestRequest {
  title: string;
  description: string;
  type: TestType;
  subject_id: number | null;
  node_id: number | null;
  settings: {
    time_limit: number;
    allow_retry: boolean;
  };
  is_published: boolean;
  created_by: string;
  class_id?: number | null;
}

export interface AddQuestionsRequest {
  test_id: string;
  question_ids: string[];
  points?: number;
  question_points?: { [question_id: string]: number };
}

export interface SubmitTestRequest {
  test_id: string;
  answers: {
    question_id: string;
    selected_option_index?: number;
    text_answer?: string;
  }[];
}

export interface TestResult {
  submission: TestSubmission;
  answers: QuizAnswer[];
  questions: Question[];
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  xp_earned?: number;
}
