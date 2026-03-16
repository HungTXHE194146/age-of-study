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
    if (error) {
      console.error("listUsers error:", error);
      return NextResponse.json(
        { error: "Failed to list users", details: error.message },
        { status: 500 }
      );
    }
    if (!data?.users?.length) break;
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
  let collisions = 0;

  // First, build a map of all existing emails for collision detection
  const allExistingEmails = new Map<string, string>();
  let emailPage = 1;
  while (true) {
    const { data: emailData, error: emailError } = await supabaseAdmin.auth.admin.listUsers({
      page: emailPage,
      perPage: 1000,
    });
    if (emailError) {
      console.error("listUsers error during email map building:", emailError);
      return NextResponse.json(
        { error: "Failed to build email collision map", details: emailError.message },
        { status: 500 }
      );
    }
    if (!emailData?.users?.length) break;
    for (const u of emailData.users) {
      if (u.email) {
        allExistingEmails.set(u.email, u.id);
      }
    }
    if (emailData.users.length < 1000) break;
    emailPage++;
  }

  // Now perform the migration
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      console.error("listUsers error:", error);
      return NextResponse.json(
        { success, skipped, errors, collisions, incomplete: true, listUsersError: error.message },
        { status: 500 }
      );
    }
    if (!data?.users?.length) break;

    const targets = data.users.filter((u) => u.email?.endsWith(OLD_DOMAIN));

    for (const user of targets) {
      const newEmail = user.email!.replace(OLD_DOMAIN, NEW_DOMAIN);

      // 1. Check if this user has a profile (skip ghost auth users)
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

      // 2. Check if the new email is already taken by another user
      const existingUserId = allExistingEmails.get(newEmail);
      if (existingUserId && existingUserId !== user.id) {
        console.warn(`Email collision detected: ${newEmail} already exists for user ${existingUserId}`);
        collisions++;
        continue;
      }

      // 3. Perform the migration
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email: newEmail }
      );

      if (updateError) {
        console.error(`Failed to migrate ${user.email}:`, updateError.message);
        errors++;
      } else {
        // Update the email map to reflect the migration
        if (user.email) {
          allExistingEmails.delete(user.email);
        }
        allExistingEmails.set(newEmail, user.id);
        success++;
      }
    }

    if (data.users.length < 1000) break;
    page++;
  }

  return NextResponse.json({ success, skipped, errors, collisions });
}
