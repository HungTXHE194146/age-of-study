import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { username, code } = await request.json();

    if (!username || !code) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên đăng nhập và mã." },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanCode = code.trim();

    // 1. Find all valid (non-expired, unused) codes matching the entered code
    const { data: candidates, error: candidatesError } = await supabaseAdmin
      .from("magic_login_codes")
      .select("id, student_id")
      .eq("code", cleanCode)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (candidatesError || !candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: "Mã không đúng hoặc đã hết hạn. Hãy nhờ thầy cô tạo mã mới nhé!" },
        { status: 401 }
      );
    }

    // 2. Among the candidates, find the one whose student's email starts with the entered username
    let matchedCodeId: string | null = null;
    let matchedProfile: { id: string; full_name: string | null } | null = null;
    let matchedEmail: string | null = null;

    for (const candidate of candidates) {
      // Get the auth user for this student
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(
        candidate.student_id
      );
      if (!authData?.user?.email) continue;

      // Email format is username@domain.local — extract the username part
      const emailUsername = authData.user.email.split("@")[0].toLowerCase();
      if (emailUsername !== cleanUsername) continue;

      // Verify this ID corresponds to a student profile
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, is_blocked")
        .eq("id", candidate.student_id)
        .eq("role", "student")
        .single();

      if (!profile) continue;

      // ✅ Check if account is blocked
      if (profile.is_blocked) {
        return NextResponse.json(
          { error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ giáo viên để được hỗ trợ." },
          { status: 403 }
        );
      }

      matchedCodeId = candidate.id;
      matchedProfile = profile;
      matchedEmail = authData.user.email;
      break;
    }

    if (!matchedCodeId || !matchedProfile || !matchedEmail) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mã không đúng. Vui lòng thử lại." },
        { status: 401 }
      );
    }

    // 3. Generate a magic link token using the student's actual stored email
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: matchedEmail,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Generate link error:", linkError);
      return NextResponse.json(
        { error: "Không thể tạo phiên đăng nhập. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    // 4. Mark code as used
    await supabaseAdmin
      .from("magic_login_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", matchedCodeId);

    return NextResponse.json({
      token_hash: linkData.properties.hashed_token,
      student_name: matchedProfile.full_name,
    });
  } catch (err) {
    console.error("Magic login verify error:", err);
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
