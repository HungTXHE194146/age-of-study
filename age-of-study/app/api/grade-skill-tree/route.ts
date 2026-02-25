import { NextRequest, NextResponse } from "next/server";
import { fetchGradeSkillTree } from "@/lib/gradeSkillTreeService";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const gradeCode = url.searchParams.get("grade");

    if (!gradeCode) {
      return NextResponse.json(
        { error: "Missing grade parameter" },
        { status: 400 }
      );
    }

    const gradeData = await fetchGradeSkillTree(gradeCode);

    return NextResponse.json(gradeData);
  } catch (error) {
    console.error("Error in grade skill tree API:", error);
    return NextResponse.json(
      { error: "Failed to fetch grade skill tree" },
      { status: 500 }
    );
  }
}