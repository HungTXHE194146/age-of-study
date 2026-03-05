"use server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Claim the one-time XP reward for an earned badge.
 *
 * Security model:
 *  - We verify the caller's identity using the SSR client (reads the browser
 *    cookie session), then use the service-role client for the DB writes.
 *  - The service-role client used here DOES NOT call auth.getUser() — it has
 *    no session; that's by design (it bypasses RLS on the server).
 */
export async function claimBadgeXpAction(
  studentId: string,
  badgeId: string,
): Promise<{ xpAwarded: number } | { error: string }> {
  // ── 1. Verify the caller is who they say they are ──────────────────────────
  const cookieStore = await cookies();
  const ssrClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // server action — no need to set cookies
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await ssrClient.auth.getUser();

  if (authError || !user || user.id !== studentId) {
    return { error: "Bạn cần đăng nhập để nhận thưởng." };
  }

  // ── 2. All DB writes use the service-role client (bypasses RLS) ────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseServerClient() as any;

  try {
    // Fetch user_badge row — must exist and be unclaimed
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

    // Read the XP reward from badges table
    const { data: badge, error: badgeError } = await supabase
      .from("badges")
      .select("xp_reward")
      .eq("id", badgeId)
      .single();

    if (badgeError || !badge) {
      return { error: "Không tìm thấy huy hiệu." };
    }

    const xpAwarded: number = badge.xp_reward ?? 50;

    // Mark XP as claimed (optimistic-lock: only if still null)
    const { error: claimError, count } = await supabase
      .from("user_badges")
      .update({ xp_claimed_at: new Date().toISOString() }, { count: "exact" })
      .eq("user_id", studentId)
      .eq("badge_id", badgeId)
      .is("xp_claimed_at", null);

    if (claimError || count === 0) {
      return { error: claimError?.message || "XP đã được nhận rồi." };
    }

    // Add XP to profile
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
        total_xp: (profile.total_xp || 0) + xpAwarded,
        weekly_xp: (profile.weekly_xp || 0) + xpAwarded,
        monthly_xp: (profile.monthly_xp || 0) + xpAwarded,
      })
      .eq("id", studentId);

    if (updateError) {
      console.error("Failed to update XP after marking badge claimed:", updateError);
      return { error: "Không thể cập nhật XP. Vui lòng thử lại." };
    }

    return { xpAwarded };
  } catch (err: any) {
    console.error("claimBadgeXpAction error:", err);
    return { error: err.message || "Lỗi không xác định." };
  }
}
