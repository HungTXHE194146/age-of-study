"use server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Test, Question } from "@/types/test";

export type TestWithQuestions = Test & {
  questions: (Question & { points: number; display_order: number })[];
};

/**
 * Server Action: Get test detail with questions bypassing RLS
 * This allows students to take a test even if RLS policies on test_questions 
 * and questions tables haven't been properly set up for them.
 */
export async function getTestWithQuestionsServer(testId: string): Promise<{ data: TestWithQuestions | null, error: string | null }> {
  const supabase = getSupabaseServerClient();

  try {
    // 1. Fetch the test details
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (testError && testError.code !== "PGRST116") {
      return { data: null, error: testError.message };
    }
    
    if (!test) {
      return { data: null, error: "Không tìm thấy bài kiểm tra này!" };
    }

    // 2. Fetch the test questions mapped with points and display order
    const { data: qData, error: qError } = await supabase
      .from("test_questions")
      .select(`
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
      `)
      .eq("test_id", testId)
      .order("display_order", { ascending: true });

    if (qError) {
      throw qError;
    }

    // 3. Transform questions to flat array
    const questions = (qData || [])
      .map((row: any) => {
        const questionData = Array.isArray(row.questions)
          ? row.questions[0]
          : row.questions;

        if (!questionData) return null;

        return {
          ...questionData,
          points: row.points,
          display_order: row.display_order,
        };
      })
      .filter((item: any) => item !== null);

    return { 
      data: {
        ...(test as Test),
        questions,
      }, 
      error: null 
    };

  } catch (err: any) {
    console.error('getTestWithQuestionsServer exception:', err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}
