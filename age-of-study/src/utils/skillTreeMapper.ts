import { CustomNodeType } from "@/components/VisualSkillTree";
import { Edge } from "@xyflow/react";

const BRANCH_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export const transformDBNodesToFlow = (dbNodes: { id: number; title: string; node_type: string; parent_node_id?: number | null; position_x?: number; position_y?: number; order_index: number; source_position?: 'top' | 'bottom' | 'left' | 'right' | null; target_position?: 'top' | 'bottom' | 'left' | 'right' | null }[], isTeacherMode: boolean) => {
  const rfNodes: CustomNodeType[] = [];
  const rfEdges: Edge[] = [];

  // 1. Map để tra cứu nhanh
  const nodeMap = new Map();
  dbNodes.forEach(n => nodeMap.set(n.id, { ...n }));

  // 2. Tìm các Chapter (Chủ điểm) và gán màu độc lập cho mỗi nhánh
  let chapterIndex = 0;
  const chapterColors = new Map();

  // Sắp xếp để đảm bảo thứ tự màu ổn định
  const sortedNodes = [...dbNodes].sort((a, b) => a.order_index - b.order_index);
  sortedNodes.forEach(n => {
    if (n.node_type === 'chapter' || n.node_type === 'subject') {
      chapterColors.set(n.id, BRANCH_COLORS[chapterIndex % BRANCH_COLORS.length]);
      chapterIndex++;
    }
  });

  // 3. Hàm đệ quy để lấy màu của nhánh cha
  const getBranchColor = (nodeId: number): string => {
    const node = nodeMap.get(nodeId);
    if (!node) return "#fbbf24";
    if (chapterColors.has(node.id)) return chapterColors.get(node.id);
    if (node.parent_node_id) return getBranchColor(node.parent_node_id);
    return "#fbbf24";
  };

  // 4. Khởi tạo Nodes và Edges
  dbNodes.forEach(node => {
    const branchColor = getBranchColor(node.id);
    // (Sau này tích hợp logic check DB xem user đã học chưa. Giờ tạm hardcode khóa node Content nếu là Học sinh)
    const isNodeLocked = isTeacherMode ? false : (node.node_type === 'content');

    // Ensure unique ID by using the database node ID
    const nodeId = node.id.toString();

    rfNodes.push({
      id: nodeId,
      type: "custom",
      position: { x: node.position_x || 0, y: node.position_y || 0 }, // Lấy tọa độ thật
      data: {
        id: node.id,
        title: node.title,
        nodeType: node.node_type,
        color: branchColor,
        isLocked: isNodeLocked,
        isTeacherMode: isTeacherMode
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