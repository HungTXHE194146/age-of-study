import { CustomNodeType } from "@/components/visual-skill-tree/types";
import { Edge } from "@xyflow/react";

const BRANCH_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export const transformDBNodesToFlow = (
  dbNodes: { 
    id: number; 
    title: string; 
    description?: string;
    node_type: string; 
    parent_node_id?: number | null; 
    position_x?: number; 
    position_y?: number; 
    order_index: number; 
    week_number?: number | null;
    required_xp?: number;
    best_xp?: number;
    source_position?: 'top' | 'bottom' | 'left' | 'right' | null; 
    target_position?: 'top' | 'bottom' | 'left' | 'right' | null 
  }[], 
  isTeacherMode: boolean,
  completedNodeIds: number[] = []
) => {
  const rfNodes: CustomNodeType[] = [];
  const rfEdges: Edge[] = [];

  // 1. Map để tra cứu nhanh
  const nodeMap = new Map();
  dbNodes.forEach(n => nodeMap.set(n.id, { ...n }));

  // 2. Gán màu theo week_number hoặc chapter (fallback cho subjects không có week)
  let chapterIndex = 0;
  const chapterColors = new Map();

  const sortedNodes = [...dbNodes].sort((a, b) => a.order_index - b.order_index);
  sortedNodes.forEach(n => {
    if (n.node_type === 'chapter' || n.node_type === 'subject') {
      chapterColors.set(n.id, BRANCH_COLORS[chapterIndex % BRANCH_COLORS.length]);
      chapterIndex++;
    }
  });

  // 3. Hàm lấy màu: ưu tiên week_number, fallback chapter cascade
  const colorCache = new Map<number, string>();
  const getBranchColor = (nodeId: number): string => {
    if (colorCache.has(nodeId)) return colorCache.get(nodeId)!;

    const node = nodeMap.get(nodeId);
    if (!node) return "#fbbf24";
    
    let color: string;

    // Week-based coloring: cùng tuần = cùng màu
    if (node.week_number) {
      color = BRANCH_COLORS[(node.week_number - 1) % BRANCH_COLORS.length];
    } else if (chapterColors.has(node.id)) {
      color = chapterColors.get(node.id);
    } else if (node.parent_node_id) {
      color = getBranchColor(node.parent_node_id);
    } else {
      color = "#fbbf24";
    }

    colorCache.set(nodeId, color);
    return color;
  };

  // Compute locks based on sequential order (Strict Sequential Locking)
  let isAnyPreviousLockedOrUncompleted = false;

  // OUT OF THE BOX FIX: Transform coordinates so the Active Node is EXACTLY at (0, 0)!
  // This physically moves the entire tree so the camera natively sees the active node on load without buggy jumps.
  let offsetX = 0;
  let offsetY = 0;

  if (sortedNodes.length > 0) {
    const isCompletable = (n: any) => n.node_type !== "chapter" && n.node_type !== "subject";

    let activeNode;
    if (!isTeacherMode) {
      // Students: first uncompleted completable node
      activeNode = sortedNodes.find(
        (n) => isCompletable(n) && !completedNodeIds.includes(n.id),
      );
    } else {
      // Teachers: first completable node (starting point)
      activeNode = sortedNodes.find((n) => isCompletable(n));
    }

    // Fallback: all done -> focus last one
    if (!activeNode) {
      const completableItems = sortedNodes.filter(isCompletable);
      activeNode =
        completableItems.length > 0
          ? completableItems[completableItems.length - 1]
          : sortedNodes[sortedNodes.length - 1];
    }

    if (activeNode) {
      offsetX = activeNode.position_x || 0;
      offsetY = activeNode.position_y || 0;
    }
  }

  // 4. Khởi tạo Nodes và Edges
  sortedNodes.forEach(node => {
    const branchColor = getBranchColor(node.id);
    
    const isCompleted = completedNodeIds.includes(Number(node.id));
    
    // Logic Khóa Node Mới:
    // - Luôn mở khóa nếu là giáo viên
    // - Cắt đứt chuỗi mở khóa nếu có MỘT node phía trước theo order_index chưa hoàn thành
    // - Node đầu tiên luôn mở khóa (isAnyPreviousLockedOrUncompleted = false)
    const isNodeLocked = isTeacherMode ? false : isAnyPreviousLockedOrUncompleted;

    // Nếu node hiện tại chưa hoàn thành -> set flag để khóa toàn bộ các node phía sau
    if (!isCompleted && node.node_type !== 'chapter' && node.node_type !== 'subject') {
       isAnyPreviousLockedOrUncompleted = true;
    }

    // Ensure unique ID by using the database node ID
    const nodeId = node.id.toString();

    rfNodes.push({
      id: nodeId,
      type: "custom",
      position: { x: (node.position_x || 0) - offsetX, y: (node.position_y || 0) - offsetY }, // Tọa độ thật chuẩn hóa hoàn toàn về (0,0)
      data: {
        id: node.id,
        title: node.title,
        description: node.description,
        nodeType: node.node_type,
        color: branchColor,
        isLocked: isNodeLocked,
        isTeacherMode: isTeacherMode,
        isCompleted: isCompleted,
        bestXp: (node as any).best_xp || 0,
        requiredXp: (node as any).required_xp || 100
      }
    });

    if (node.parent_node_id) {
      rfEdges.push({
        id: `e-${node.parent_node_id}-${node.id}`,
        source: node.parent_node_id.toString(),
        target: nodeId,
        sourceHandle: node.source_position || 'bottom', // Gắn handle nguồn
        targetHandle: node.target_position || 'top',    // Gắn handle đích
        type: "custom",
        data: { color: branchColor }
      });
    }
  });

  return { nodes: rfNodes, edges: rfEdges };
};