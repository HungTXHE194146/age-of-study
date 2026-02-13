import { getSupabaseBrowserClient } from "./supabase";
import {
  Test,
  Question,
  TestQuestion,
  TestSubmission,
  QuizAnswer,
  TestWithQuestions,
  CreateTestRequest,
  AddQuestionsRequest,
  SubmitTestRequest,
  TestResult,
  TestSubmissionWithAnswers,
} from "@/types/test";

// Interface for the Supabase query result structure
interface TestQuestionWithQuestion {
  question_id: string;
  points: number;
  display_order: number;
  questions: Question[] | null;
}

// Interface for the Supabase query row structure in getTestQuestions
interface TestQuestionRow {
  points: number;
  display_order: number;
  questions: Question | Question[] | null;
}

export class TestService {
  // Test Management (Teacher)

  async createTest(testData: CreateTestRequest): Promise<Test> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("tests")
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error("Create test error:", error);
      throw error;
    }
    return data;
  }

  async getTestsByTeacher(teacherId: string): Promise<Test[]> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("tests")
      .select("*")
      .eq("created_by", teacherId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTestById(testId: string): Promise<Test | null> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  async updateTest(testId: string, updates: Partial<Test>): Promise<Test> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("tests")
      .update(updates)
      .eq("id", testId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTest(testId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("tests").delete().eq("id", testId);

    if (error) throw error;
  }

  // Question Management

  async getQuestionsByNode(nodeId: number): Promise<Question[]> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("node_id", nodeId)
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getRandomQuestions(nodeId: number, limit: number): Promise<Question[]> {
    // Fetch a larger batch and shuffle client-side since Supabase doesn't support ORDER BY RANDOM() easily
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("node_id", nodeId)
      .eq("status", "available")
      .limit(limit * 3); // Get 3x the amount to ensure randomness

    if (error) throw error;

    const questions = data || [];

    // Fisher-Yates shuffle algorithm
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions.slice(0, limit);
  }

  async addQuestionsToTest(request: AddQuestionsRequest): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    const testQuestions = request.question_ids.map((questionId, index) => ({
      test_id: request.test_id,
      question_id: questionId,
      points: request.question_points?.[questionId] || request.points || 10,
      display_order: index,
    }));

    const { error } = await supabase
      .from("test_questions")
      .insert(testQuestions);

    if (error) throw error;
  }

  async removeQuestionFromTest(
    testId: string,
    questionId: string,
  ): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("test_questions")
      .delete()
      .eq("test_id", testId)
      .eq("question_id", questionId);

    if (error) throw error;
  }

  async getTestQuestions(
    testId: string,
  ): Promise<(Question & { points: number; display_order: number })[]> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("test_questions")
      .select(
        `
      points,
      display_order,
      questions (
        id,
        node_id,
        content,
        correct_option_index,
        difficulty,
        status,
        created_by,
        created_at
      )
    `,
      )
      .eq("test_id", testId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    if (!data) return [];

    // 1. Map through the rows
    return data
      .map((row: TestQuestionRow) => {
        // 2. Extract the nested question object ONCE
        // Note: Since test_questions links to questions via ID, Supabase usually returns
        // a single object, not an array. But we handle both just in case.
        const questionData = Array.isArray(row.questions)
          ? row.questions[0]
          : row.questions;

        // 3. Check for valid data (in case a question was deleted but the link remains)
        if (!questionData) return null;

        // 4. Return the flattened object using Spread (...)
        return {
          ...questionData, // Spreads id, content, difficulty, etc. automatically
          points: row.points,
          display_order: row.display_order,
        };
      })
      .filter(
        (
          item: (Question & { points: number; display_order: number }) | null,
        ): item is Question & { points: number; display_order: number } =>
          item !== null,
      ); // 5. Remove any nulls
  }

  async updateQuestionOrder(
    testId: string,
    questionOrders: { questionId: string; order: number }[],
  ): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    const updates = questionOrders.map(({ questionId, order }) => ({
      test_id: testId,
      question_id: questionId,
      display_order: order,
    }));

    const { error } = await supabase
      .from("test_questions")
      .upsert(updates, { onConflict: "test_id,question_id" });

    if (error) throw error;
  }

  // Test Taking (Student)

  async startTest(testId: string, studentId: string): Promise<TestSubmission> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("test_submissions")
      .insert({
        test_id: testId,
        student_id: studentId,
        status: "in_progress",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTestSubmission(
    submissionId: string,
  ): Promise<TestSubmissionWithAnswers | null> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("test_submissions")
      .select(
        `
        *,
        quiz_answers (
          *
        )
      `,
      )
      .eq("id", submissionId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  async submitTest(
    request: SubmitTestRequest,
    studentId: string,
  ): Promise<TestResult> {
    // Start transaction
    const supabase = getSupabaseBrowserClient();
    const { data: submission, error: submissionError } = await supabase
      .from("test_submissions")
      .insert({
        test_id: request.test_id,
        student_id: studentId,
        status: "completed",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Get test questions to validate answers
    const testQuestions = await this.getTestQuestions(request.test_id);
    const questionMap = new Map(testQuestions.map((q) => [q.id, q]));

    // Prepare answers
    const answers = request.answers.map((answer) => ({
      submission_id: submission.id,
      question_id: answer.question_id,
      selected_option_index: answer.selected_option_index,
      is_correct:
        questionMap.get(answer.question_id)?.correct_option_index ===
        answer.selected_option_index,
    })) as QuizAnswer[];

    // Insert answers
    const { error: answersError } = await supabase
      .from("quiz_answers")
      .insert(answers);

    if (answersError) throw answersError;

    // Calculate results
    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const totalQuestions = testQuestions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Update submission with results
    const { error: updateError } = await supabase
      .from("test_submissions")
      .update({
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
      })
      .eq("id", submission.id);

    if (updateError) throw updateError;

    return {
      submission,
      answers,
      questions: testQuestions,
      score,
      percentage: score,
      totalQuestions,
      correctAnswers,
    };
  }

  async getStudentSubmissions(
    studentId: string,
    testId?: string,
  ): Promise<TestSubmission[]> {
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from("test_submissions")
      .select("*")
      .eq("student_id", studentId);

    if (testId) {
      query = query.eq("test_id", testId);
    }

    const { data, error } = await query.order("started_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  }

  // Published Tests (Student View)

  async getPublishedTests(): Promise<Test[]> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("tests")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTestWithQuestions(
    testId: string,
  ): Promise<TestWithQuestions | null> {
    const supabase = getSupabaseBrowserClient();
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (testError && testError.code !== "PGRST116") throw testError;
    if (!test) return null;

    const questions = await this.getTestQuestions(testId);

    return {
      ...test,
      questions,
    };
  }

  // Utility functions

  async canEditTest(testId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("tests")
      .select("created_by")
      .eq("id", testId)
      .single();

    if (error) return false;
    return data?.created_by === userId;
  }

  async canViewTest(testId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("tests")
      .select("is_published, created_by")
      .eq("id", testId)
      .single();

    if (error) return false;

    // Student can view if published, Teacher/Admin can view their own
    return data?.is_published || data?.created_by === userId;
  }

  // Statistics and Analytics

  async getTestQuestionCount(testId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient();
    const { count, error } = await supabase
      .from("test_questions")
      .select("*", { count: "exact" })
      .eq("test_id", testId);

    if (error) throw error;
    return count || 0;
  }

  async getTeacherTotalQuestionCount(teacherId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient();
    const { data: testIds, error: testError } = await supabase
      .from("tests")
      .select("id")
      .eq("created_by", teacherId);

    if (testError) throw testError;
    if (!testIds || testIds.length === 0) return 0;

    const testIdList = testIds.map((t: { id: string }) => t.id);
    const { count, error } = await supabase
      .from("test_questions")
      .select("*", { count: "exact" })
      .in("test_id", testIdList);

    if (error) throw error;
    return count || 0;
  }

  async getTestsWithQuestionCounts(
    teacherId: string,
  ): Promise<(Test & { question_count: number })[]> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.rpc(
      "get_tests_with_question_counts",
      {
        p_teacher_id: teacherId,
      },
    );

    if (error) throw error;
    return data || [];
  }
}
