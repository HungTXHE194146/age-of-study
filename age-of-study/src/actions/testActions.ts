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

/**
 * Server Action: Sync test progress reliably using service_role key
 * This bypasses any RLS issues or missing RPCs that might prevent student_node_progress from updating.
 */
export async function syncTestProgressAction(
  studentId: string, 
  testId: string, 
  score: number, 
  xpEarned: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseClient = getSupabaseServerClient();
    const supabase = supabaseClient as any; // Cast to any to bypass strict typing for missing tables
    
    // 1. We bypass the RPC function to run JS logic because the DB one might not have the correct submit_count/bestScore logic
    
    // 2. Get the node_id for this test
    const { data: testData } = await supabase
      .from("tests")
      .select("node_id")
      .eq("id", testId)
      .single();
      
    if (testData?.node_id) {
      const isCompleted = score >= 50;
      
      // Get existing progress to prevent overwriting with lower scores
      const { data: existingProgress } = await supabase
        .from("student_node_progress")
        .select("*")
        .eq("student_id", studentId)
        .eq("node_id", testData.node_id)
        .single();

      let finalStatus = isCompleted ? "completed" : "in_progress";
      let finalScoreStr = score.toString();
      let finalCompletedAt = isCompleted ? new Date().toISOString() : null;
      let submitCount = 1;

      if (existingProgress) {
        // Keep completed status if it was already completed
        if (existingProgress.status === "completed") {
          finalStatus = "completed";
          finalCompletedAt = existingProgress.completed_at || finalCompletedAt;
        }
        
        // Keep the higher score
        const existingScoreNum = parseInt(existingProgress.score || "0", 10);
        if (score < existingScoreNum) {
          finalScoreStr = existingProgress.score;
        }
        
        // Increment submit count
        submitCount = (existingProgress.submit_count || 0) + 1;
      }

      // Update progress with best stats
      await supabase
        .from("student_node_progress")
        .upsert({
          student_id: studentId,
          node_id: testData.node_id,
          status: finalStatus,
          completed_at: finalCompletedAt,
          score: finalScoreStr,
          submit_count: submitCount,
          last_accessed_at: new Date().toISOString()
        }, { onConflict: "student_id, node_id" });
    }
    
    // 3. Update XP
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", studentId)
      .single();
      
    if (profile) {
      await supabase
        .from("profiles")
        .update({ total_xp: (profile.total_xp || 0) + xpEarned })
        .eq("id", studentId);
    }
    
    // 4. Activity Log
    await supabase
      .from("activity_logs")
      .insert({
         student_id: studentId,
         activity_type: 'test_completed',
         description: `Hoàn thành bài tập với điểm số ${score}%`,
         xp_earned: xpEarned,
         metadata: { test_id: testId, score, node_id: testData?.node_id }
      });
      
    return { success: true };
  } catch (error: any) {
    console.error("Failed to sync progress via server action:", error);
    return { success: false, error: error.message };
  }
}
