import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/adminAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { teachers } = body;

    if (!Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty data" },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      skipped: 0,
      errors: 0,
      logs: [] as { action: string; username: string; message: string }[],
    };

    // Process each teacher
    for (const teacher of teachers) {
      if (!teacher.username || !teacher.full_name || !teacher.dob) {
        results.errors++;
        results.logs.push({
          action: "error",
          username: teacher.username || "Unknown",
          message: "Missing required fields",
        });
        continue;
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", teacher.username)
        .single();

      if (existingUser) {
        results.skipped++;
        results.logs.push({
          action: "skipped",
          username: teacher.username,
          message: "User already exists",
        });
        continue;
      }

      // Generate secure temporary password
      const password = globalThis.crypto.randomUUID().slice(0, 12);

      // Create auth user using existing supabaseAdmin instance
      // Using @ageofstudy.local to match how login in useAuthStore works
      const fakeEmail = `${teacher.username.toLowerCase().trim()}@ageofstudy.local`;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          username: teacher.username,
          full_name: teacher.full_name,
        },
      });

      if (authError) {
        results.errors++;
        results.logs.push({
          action: "error",
          username: teacher.username,
          message: `Auth creation failed: ${authError.message}`,
        });
        continue;
      }

      if (!authData.user) {
        results.errors++;
        results.logs.push({
          action: "error",
          username: teacher.username,
          message: "Auth user created but no user data returned",
        });
        continue;
      }

      const userId = authData.user.id;

      let isoDate = null;
      // parse DD/MM/YYYY to YYYY-MM-DD
      const dateParts = teacher.dob.split("/");
      if (dateParts.length === 3) {
        isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      }

      // Update profile created by trigger
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          username: teacher.username,
          full_name: teacher.full_name,
          role: "teacher",
          gender: teacher.gender,
          ethnicity: teacher.ethnicity,
          phone_number: teacher.phone_number || null,
          dob: isoDate,
          must_change_password: true,
          metadata: teacher.metadata || {},
        })
        .eq("id", userId);

      if (profileError) {
        // Rollback Auth user creation
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        results.errors++;
        results.logs.push({
          action: "error",
          username: teacher.username,
          message: `Profile update failed: ${profileError.message}` + (deleteError ? ` (Failed to rollback user: ${deleteError.message})` : " (Auth user rolled back)"),
        });
      } else {
        results.success++;
        results.logs.push({
          action: "success",
          username: teacher.username,
          message: "Imported successfully",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Teacher Import API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
