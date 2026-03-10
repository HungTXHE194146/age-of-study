"use server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Xác định Volume hiện tại mà học sinh đang học dựa vào tiến độ hoàn thành.
 * Truy vấn tuần tự các lesson nodes, và gán volume cho bài học đầu tiên chưa hoàn thành.
 */
export async function getRecommendedVolumeAction(
  subjectId: number,
  studentId: string
): Promise<number | null> {
  try {
    const supabase = getSupabaseServerClient();

    // 1. Get completed node IDs for the student
    const { data: progressData, error: progressError } = await supabase
      .from("student_node_progress")
      .select("node_id")
      .eq("student_id", studentId)
      .eq("status", "completed");

    if (progressError) {
      console.error("Error fetching progress for volume:", progressError);
      return 1; // Default fallback
    }

    const completedIds = (progressData as { node_id: number }[]).map((p) => p.node_id);

    // 2. Fetch all lesson nodes for the subject to determine order and volume
    const { data: nodesData, error: nodesError } = await supabase
      .from("nodes")
      .select("id, order_index, volume_number")
      .eq("subject_id", subjectId)
      .eq("node_type", "lesson")
      .order("order_index", { ascending: true });

    if (nodesError || !nodesData || nodesData.length === 0) {
      return 1; // Default fallback
    }

    const nodesDataCasted = nodesData as { id: number; order_index: number; volume_number: number | null }[];

    // 3. Find the first node that is NOT in completedIds
    const nextNode = nodesDataCasted.find((n) => !completedIds.includes(Number(n.id)));

    // If all completed, return the volume of the last node
    if (!nextNode) {
      return nodesDataCasted[nodesDataCasted.length - 1].volume_number || 1;
    }

    return nextNode.volume_number || 1;
  } catch (error) {
    console.error("Error in getRecommendedVolumeAction:", error);
    return 1;
  }
}
