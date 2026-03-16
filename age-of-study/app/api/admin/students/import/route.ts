import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/adminAuth";
import { createAuditLog } from "@/lib/auditService";
import { ParsedStudent } from "@/components/admin/StudentImportModal";
import { now } from "lodash";

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
    const adminUserId = authResult.userId;

    const { students } = await request.json();
    if (!students || !Array.isArray(students)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    const MAX_BATCH_SIZE = 100;
    if (students.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: "Batch too large" },
        { status: 413 }
      );
    }

    let classIdCache: Record<string, number> = {};
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let classesCreatedCount = 0;

    // Cache to prevent duplicate queries for generated class codes

    for (const student of students as ParsedStudent[]) {
      if (student.rowStatus === "missing_data" || student.rowStatus === "error") {
        errorCount++;
        continue;
      }

      const {
        username,
        fullName,
        dob,
        gender,
        ethnicity,
        phone,
        status,
        className,
        matchedClassId,
        grade,
      } = student;

      if (!username || !fullName) {
        errorCount++;
        continue;
      }

      // 2. Class Resolution (Auto-create if needed)
      let finalClassId: number | undefined = matchedClassId;
      
      if (!finalClassId && className) {
        const cacheKey = className.toLowerCase().trim();
        
        if (classIdCache[cacheKey]) {
          finalClassId = classIdCache[cacheKey];
        } else {
          // Check DB just in case another chunk created it
          const { data: existingClass } = await supabaseAdmin
            .from("classes")
            .select("id")
            .ilike("name", cacheKey)
            .single();

          if (existingClass) {
            finalClassId = existingClass.id;
            classIdCache[cacheKey] = finalClassId as number;
          } else {
            // Create New Class
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const classCode = `${className.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}_${randomSuffix}`;

            // Derive school year from current date (Aug-Dec = current year, Jan-Jul = previous year)
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const schoolYear = month >= 7 
              ? `${year}-${year + 1}` 
              : `${year - 1}-${year}`;

            const { data: newClass, error: classInputError } = await supabaseAdmin
              .from("classes")
              .upsert({
                name: className,
                grade: grade ? Number(grade) : 1,
                school_year: schoolYear,
                class_code: classCode,
                status: "active",
              }, { onConflict: "name" })
              .select("id")
              .single();

            if (classInputError) {
              const { data: existingClassFallback } = await supabaseAdmin
                .from("classes")
                .select("id")
                .ilike("name", cacheKey)
                .single();

              if (existingClassFallback) {
                finalClassId = existingClassFallback.id;
                classIdCache[cacheKey] = finalClassId as number;
              } else {
                console.error(`Error creating class ${className}:`, classInputError);
                errorCount++;
                continue; // Skip this student if class creation failed
              }
            } else if (newClass) {
              finalClassId = newClass.id;
              classIdCache[cacheKey] = finalClassId as number;
              classesCreatedCount++;
            }
          }
        }
      }

      // 3. User Resolution / Creation

      // Generate a secure random password for new users
      // DOB should not be used as a password due to security concerns
      // The must_change_password flag (set below) will force users to change it on first login
      // Note: The authentication flow MUST enforce password change when must_change_password is true
      const password = globalThis.crypto.randomUUID();

      // Try finding the user first by username
      const { data: existingUserParams } = await supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("username", username)
        .single();
        
      let targetUserId = existingUserParams?.id;

      if (!targetUserId) {
        // Create user via Supabase Auth Admin
        const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
          email: `${username}@ageofstudy.local`, // Must match the domain used in login
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            username: username,
            role: "student",
          },
        });

        if (authCreateError) {
          // Could be email conflict or password too weak
          console.error(`Auth creation failed for ${username}:`, authCreateError);
          errorCount++;
          continue;
        }

        targetUserId = authData.user.id;

        // Note: The `profiles` table automatically creates a row via trigger for new Auth users.
        // We will update it below.
      } else if (existingUserParams?.role !== "student") {
        // Skip updating non-students
        skippedCount++;
        continue;
      }

      if (!targetUserId) continue;

      const updatePayload: any = {
        full_name: fullName,
        username: username,
        role: "student",
        grade: grade ? Number(grade) : null,
        dob: dob,
        gender: gender,
        ethnicity: ethnicity,
        phone_number: phone,
        enroll_status: status || "active",
        must_change_password: !existingUserParams, // Force change if newly created
      };

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(updatePayload)
        .eq("id", targetUserId);

      if (profileError) {
        console.error(`Profile update failed for ${username}:`, profileError);
        errorCount++;
        continue;
      }

      // 5. Assign Student to Class
      if (finalClassId) {
        // Check if student is already in a different class
        const { data: currentClassMapping } = await supabaseAdmin
          .from("class_students")
          .select("class_id")
          .eq("student_id", targetUserId)
          .eq("status", "active")
          .maybeSingle();

        if (currentClassMapping?.class_id !== finalClassId) {
          // If in a different active class, withdraw them from it
          if (currentClassMapping) {
            const { error: transferError } = await supabaseAdmin
              .from("class_students")
              .update({
                status: "transferred",
                left_at: new Date().toISOString()
              })
              .eq("student_id", targetUserId)
              .eq("class_id", currentClassMapping.class_id);

            if (transferError) {
              console.error(`Class transfer failed for ${username}:`, transferError);
              errorCount++;
              continue;
            }
          }
          
          // Insert into new class
          const { error: assignError } = await supabaseAdmin
            .from("class_students")
            .insert({
              class_id: finalClassId as number,
              student_id: targetUserId as string,
              status: "active",
              joined_at: new Date().toISOString(),
            });

          if (assignError && assignError.code !== "23505") { // Ignore uniqueness violation
            console.error(`Class assignment failed for ${username}:`, assignError);
            errorCount++;
            continue; // Mark as error if we couldn't assign
          }
        }
      }

      successCount++;
    }

    // Log the action
    if (successCount > 0) {
      await createAuditLog(
        adminUserId,
        {
          action: "user_created",
          resourceId: "batch",
          resourceType: "profiles",
          description: `Đã import ${successCount} học sinh`,
          metadata: {
            successCount,
            skippedCount,
            classesCreatedCount,
            errorCount,
          },
        },
        request
      );
    }

    return NextResponse.json({
      success: true,
      message: `Processed batch of ${students.length}`,
      results: {
        success: successCount,
        skipped: skippedCount,
        errors: errorCount,
        classesCreated: classesCreatedCount,
      },
    });

  } catch (err: any) {
    console.error("Student Import error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to import batch" },
      { status: 500 }
    );
  }
}
