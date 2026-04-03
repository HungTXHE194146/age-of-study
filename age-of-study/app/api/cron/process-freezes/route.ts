import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// Vercel Cron Job: POST /api/cron/process-freezes
// Schedule: Every day at 17:00 UTC = 00:00 VN (UTC+7)
//
// Logic:
//   For each student whose last_study_date was EXACTLY yesterday (VN time):
//     - If they have freeze_count > 0  → consume 1 freeze, keep streak intact
//     - If they have freeze_count = 0  → reset streak to 0
//   Students with last_study_date = today are untouched (already studied).
//   Students with last_study_date older than yesterday already had a broken
//   streak (or multi-day gap); the per-submit logic in testActions handles
//   the multi-day catch-up when they next submit.
// ============================================================================

function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Convert a UTC Date to Vietnam (UTC+7) YYYY-MM-DD string */
function toVNDate(d: Date): string {
  const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  // Security: Vercel signs cron requests with this header.
  // Reject any call that isn't from Vercel's scheduler.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServerSupabase();
  const now = new Date();
  const todayVN = toVNDate(now);

  // Yesterday in VN time
  const yesterdayDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayVN = yesterdayDate.toISOString().slice(0, 10);

  try {
    // Call the DB function that handles the batch update atomically
    const { data, error } = await supabase.rpc("process_daily_freezes", {
      p_yesterday: yesterdayVN,
      p_today: todayVN,
    });

    if (error) {
      console.error("[cron/process-freezes] RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(
      `[cron/process-freezes] Done at ${now.toISOString()}. Result:`,
      data
    );

    return NextResponse.json({
      ok: true,
      processedAt: now.toISOString(),
      todayVN,
      yesterdayVN,
      result: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/process-freezes] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
