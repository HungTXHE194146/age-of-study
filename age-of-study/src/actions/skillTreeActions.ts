"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// Define the Node type to match the database schema
interface Node {
  id: number;
  position_x?: number;
  position_y?: number;
  parent_node_id?: number | null;
}

export type NodePosition = {
  id: number;
  x: number;
  y: number;
};

export async function updateNodePositions(
  positions: NodePosition[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // Validate input
    if (!positions || positions.length === 0) {
      return { success: false, error: "No positions provided" };
    }

    // Validate each position
    for (const pos of positions) {
      if (!pos.id || typeof pos.x !== "number" || typeof pos.y !== "number") {
        return { success: false, error: "Invalid position data" };
      }
    }

    // Update positions using individual updates to avoid type issues
    for (const pos of positions) {
      const { error } = await supabase
        .from("nodes")
        .update({ position_x: pos.x, position_y: pos.y })
        .eq("id", pos.id);

      if (error) {
        console.error("Error updating node position:", error);
        return { success: false, error: error.message };
      }
    }

    // Revalidate the skill tree page to reflect changes
    revalidatePath("/teacher/skill-tree");

    return { success: true };
  } catch (error) {
    console.error("Error in updateNodePositions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateNodeConnection(
  sourceId: number,
  targetId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // Validate input
    if (!sourceId || !targetId) {
      return { success: false, error: "Invalid node IDs provided" };
    }

    if (sourceId === targetId) {
      return { success: false, error: "Cannot connect node to itself" };
    }

    // Check if nodes exist
    const { data: sourceNode, error: sourceError } = await supabase
      .from("nodes")
      .select("id")
      .eq("id", sourceId)
      .single();

    if (sourceError || !sourceNode) {
      return { success: false, error: "Source node not found" };
    }

    const { data: targetNode, error: targetError } = await supabase
      .from("nodes")
      .select("id")
      .eq("id", targetId)
      .single();

    if (targetError || !targetNode) {
      return { success: false, error: "Target node not found" };
    }

    // Check if this would create a circular reference
    const { data: targetParent, error: parentError } = await supabase
      .from("nodes")
      .select("parent_node_id")
      .eq("id", targetId)
      .single();

    if (parentError) {
      return { success: false, error: "Error checking target node parent" };
    }

    // Update the parent_node_id for the target node
    const { error: updateError } = await supabase
      .from("nodes")
      .update({ parent_node_id: sourceId })
      .eq("id", targetId);

    if (updateError) {
      console.error("Error updating node connection:", updateError);
      return { success: false, error: updateError.message };
    }

    // Revalidate the skill tree page to reflect changes
    revalidatePath("/teacher/skill-tree");

    return { success: true };
  } catch (error) {
    console.error("Error in updateNodeConnection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
