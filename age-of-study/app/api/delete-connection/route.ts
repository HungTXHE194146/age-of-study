import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, targetId } = body;

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin sourceId hoặc targetId" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // Cập nhật parent_node_id của target node về null để xóa kết nối
    const { error } = await supabase
      .from("nodes")
      .update({ parent_node_id: null })
      .eq("id", targetId);

    if (error) {
      console.error("Error deleting connection:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete-connection API:", error);
    return NextResponse.json(
      { success: false, error: "Đã xảy ra lỗi hệ thống" },
      { status: 500 },
    );
  }
}
