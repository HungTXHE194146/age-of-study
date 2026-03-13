import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/adminAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const OLD_DOMAIN = "@student.ageofstudy.com";
const NEW_DOMAIN = "@ageofstudy.local";

/**
 * GET  – dry-run: returns count of users that need migration
 * POST – actually perform the migration in batches
 */

export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  // Count auth users with the old domain
  let page = 1;
  let total = 0;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    total += data.users.filter((u) =>
      u.email?.endsWith(OLD_DOMAIN)
    ).length;
    if (data.users.length < 1000) break;
    page++;
  }

  return NextResponse.json({ needsMigration: total, oldDomain: OLD_DOMAIN, newDomain: NEW_DOMAIN });
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  let success = 0;
  let skipped = 0;
  let errors = 0;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      console.error("listUsers error:", error);
      break;
    }
    if (!data?.users?.length) break;

    const targets = data.users.filter((u) => u.email?.endsWith(OLD_DOMAIN));

    for (const user of targets) {
      const newEmail = user.email!.replace(OLD_DOMAIN, NEW_DOMAIN);

      // Check the new email isn't already taken
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existing) {
        // No profile → skip ghost auth user
        skipped++;
        continue;
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email: newEmail }
      );

      if (updateError) {
        console.error(`Failed to migrate ${user.email}:`, updateError.message);
        errors++;
      } else {
        success++;
      }
    }

    if (data.users.length < 1000) break;
    page++;
  }

  return NextResponse.json({ success, skipped, errors });
}
