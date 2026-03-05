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
          created_at,
          q_type,
          model_answer
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
    
    // 2. Get the node_id and title for this test
    const { data: testData } = await supabase
      .from("tests")
      .select("node_id, title")
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
    
    // 3. Update XP + Streak + Weekly/Monthly XP (atomic via RPC)
    // ── Compute streak delta client-side, then apply atomically ─────────────
    const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
    const toVNDate = (d: Date): string =>
      new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
    const today = toVNDate(new Date());

    // Fetch only what we need to compute streak / freeze changes
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_streak, last_study_date, freeze_count")
      .eq("id", studentId)
      .single();

    let streakDelta = 0;     // signed change to current_streak
    let freezeDelta = 0;     // signed change to freeze_count (negative = consumed)
    let freezeUsed  = false;

    if (profile) {
      const lastStudy: string | null = profile.last_study_date
        ? toVNDate(new Date(profile.last_study_date as string))
        : null;
      const currentStreak: number = profile.current_streak ?? 0;
      const freezeCount: number   = profile.freeze_count   ?? 0;

      if (!lastStudy) {
        // First-ever study session: initialise streak to 1
        streakDelta = 1 - currentStreak;
      } else if (lastStudy === today) {
        // Already studied today — idempotent
        streakDelta = 0;
      } else {
        const daysDiff = Math.floor(
          (new Date(today).getTime() - new Date(lastStudy).getTime()) / 86_400_000,
        );

        if (daysDiff === 1) {
          // Studied yesterday — extend streak
          streakDelta = 1;
        } else {
          // Missed ≥2 days: need (daysDiff - 1) freezes to cover all gaps
          const neededFreezes = daysDiff - 1;
          if (freezeCount >= neededFreezes) {
            // Enough freezes — maintain streak, consume exactly what's needed
            freezeDelta = -neededFreezes;
            freezeUsed  = true;
            streakDelta = 0; // streak is maintained, NOT incremented
          } else {
            // Not enough freezes — reset streak
            streakDelta = 1 - currentStreak;
          }
        }
      }
    }

    // Single atomic RPC: increments XP columns and adjusts streak/freeze_count
    const { error: rpcError } = await supabase.rpc("increment_profile_xp", {
      p_student_id:     studentId,
      p_xp_delta:       xpEarned,
      p_streak_delta:   streakDelta,
      p_freeze_delta:   freezeDelta,
      p_last_study_date: today,
    });

    if (rpcError) {
      console.error(`[syncTestProgress] increment_profile_xp RPC failed for ${studentId}:`, rpcError);
      return { success: false, error: rpcError.message };
    }

    if (freezeUsed) {
      console.log(`[streak] ${-freezeDelta} freeze(s) consumed for student ${studentId}.`);
    }

    
    // 4. Activity Log
    const testTitle = testData?.title || 'bài tập';
    await supabase
      .from("activity_logs")
      .insert({
         student_id: studentId,
         activity_type: 'test_completed',
         description: `Hoàn thành bài tập: ${testTitle} với điểm số ${score}%`,
         xp_earned: xpEarned,
         metadata: { test_id: testId, score, node_id: testData?.node_id }
      });
      
    return { success: true };
  } catch (error: any) {
    console.error("Failed to sync progress via server action:", error);
    return { success: false, error: error.message };
  }
}
