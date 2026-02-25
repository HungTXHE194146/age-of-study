import { getSupabaseBrowserClient } from "@/lib/supabase";

// Định nghĩa interface Node để match với database schema
export interface Node {
  id: number;
  title: string;
  description?: string;
  parent_node_id?: number | null;
  node_type: string;
  required_xp: number;
  position_x?: number;
  position_y?: number;
  order_index: number;
  children?: Node[];
}

/**
 * Client-side function: Lấy toàn bộ cây kỹ năng của một môn học
 * @param subjectId ID của môn học
 * @returns Cấu trúc cây kỹ năng hoàn chỉnh
 */
export async function fetchSubjectSkillTree(
  subjectId: number,
): Promise<Node[]> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Gọi RPC function get_skill_tree từ Supabase
    const { data, error } = await supabase.rpc("get_skill_tree", {
      p_subject_id: subjectId,
    });

    if (error) {
      console.error("Error fetching skill tree:", error);
      throw new Error(`Failed to fetch skill tree: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Chuyển đổi mảng phẳng thành cấu trúc cây lồng nhau
    const skillTree = buildSkillTree(data);

    return skillTree;
  } catch (error) {
    console.error("Error in fetchSubjectSkillTree:", error);
    throw error;
  }
}

/**
 * Build skill tree from flat array to nested structure
 * @param nodes Flat array of nodes from database
 * @returns Nested tree structure
 */
function buildSkillTree(nodes: Node[]): Node[] {
  const nodeMap = new Map<number, Node>();
  const rootNodes: Node[] = [];

  // Create a map of all nodes for quick lookup
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Build the tree structure
  nodes.forEach(node => {
    const currentNode = nodeMap.get(node.id)!;
    
    if (node.parent_node_id === null || node.parent_node_id === undefined) {
      // This is a root node
      rootNodes.push(currentNode);
    } else {
      // This is a child node, find its parent
      const parent = nodeMap.get(node.parent_node_id);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(currentNode);
      } else {
        // Parent not found, treat as root
        rootNodes.push(currentNode);
      }
    }
  });

  // Sort children by order_index
  function sortChildren(node: Node) {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      node.children.forEach(sortChildren);
    }
  }

  rootNodes.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  rootNodes.forEach(sortChildren);

  return rootNodes;
}

