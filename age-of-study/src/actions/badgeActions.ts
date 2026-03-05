"use server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Claim the one-time XP reward for an earned badge.
 * Guards: badge must be earned, XP not yet claimed.
 */
export async function claimBadgeXpAction(
  studentId: string,
  badgeId: string
): Promise<{ xpAwarded: number } | { error: string }> {
  // Use the typed client for auth, then cast for DB ops (project has no generated Supabase types)
  const supabaseTyped = getSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = supabaseTyped as any;

  // Verify the caller is the owner of the badge being claimed
  const { data: { user }, error: authError } = await supabaseTyped.auth.getUser();
  if (authError || !user || user.id !== studentId) {
    return { error: "Unauthorized" };
  }

  try {
    // 1. Fetch user_badge row — must exist and be unclaimed
    const { data: userBadge, error: ubError } = await supabase
      .from("user_badges")
      .select("badge_id, xp_claimed_at")
      .eq("user_id", studentId)
      .eq("badge_id", badgeId)
      .single();

    if (ubError || !userBadge) {
      return { error: "Huy hiệu chưa được mở khóa." };
    }

    if (userBadge.xp_claimed_at) {
      return { error: "XP đã được nhận rồi." };
    }

    // 2. Read the XP reward from badges table
    const { data: badge, error: badgeError } = await supabase
      .from("badges")
      .select("xp_reward")
      .eq("id", badgeId)
      .single();

    if (badgeError || !badge) {
      return { error: "Không tìm thấy huy hiệu." };
    }

    const xpAwarded: number = badge.xp_reward ?? 50;

    // 3. Mark XP as claimed
    const { error: claimError, count } = await supabase
      .from("user_badges")
      .update({ xp_claimed_at: new Date().toISOString() }, { count: 'exact' })
      .eq("user_id", studentId)
      .eq("badge_id", badgeId)
      .is("xp_claimed_at", null);

    if (claimError || count === 0) {
      return { error: claimError?.message || "XP đã được nhận rồi." };
    }

    // 4. Add XP to profile (total + weekly + monthly)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("total_xp, weekly_xp, monthly_xp")
      .eq("id", studentId)
      .single();

    if (profileError || !profile) {
      return { error: "Không thể cập nhật XP." };
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        total_xp:   (profile.total_xp   || 0) + xpAwarded,
        weekly_xp:  (profile.weekly_xp  || 0) + xpAwarded,
        monthly_xp: (profile.monthly_xp || 0) + xpAwarded,
      })
      .eq("id", studentId);

    if (updateError) {
      // Consider rolling back the xp_claimed_at update or logging for manual reconciliation
      console.error("Failed to update XP after marking badge claimed:", updateError);
      return { error: "Không thể cập nhật XP. Vui lòng thử lại." };
    }
    return { xpAwarded };
  } catch (err: any) {
    console.error("claimBadgeXpAction error:", err);
    return { error: err.message || "Lỗi không xác định." };
  }
}
