import { Node, Edge } from '@xyflow/react';

// Dimensions and Spacing
const Y_SPACING = 200; // Khoảng cách dọc giữa các node
const X_OFFSET = 70; // Độ lệch so le trái/phải
const COMPONENT_GAP = 250; // Khoảng cách giữa các cụm (chương) độc lập

/**
 * Tính toán tọa độ cho React Flow Node theo phong cách dọc (Duolingo Zig-Zag)
 * 
 * @param nodes Standard React Flow nodes
 * @param edges Standard React Flow edges
 * @returns Object chứa nodes đã có tọa độ mới và edges giữ nguyên
 */
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[]
) => {
  if (nodes.length === 0) return { nodes, edges };

  // 1. Dựng đồ thị: Danh sách con & Bậc vào (In-degree)
  const childrenMap = new Map<string, Node[]>();
  const inDegree = new Map<string, number>();
  const nodeMap = new Map<string, Node>();

  nodes.forEach(n => {
    nodeMap.set(n.id, n);
    inDegree.set(n.id, 0);
    childrenMap.set(n.id, []);
  });

  edges.forEach(e => {
    if (childrenMap.has(e.source) && inDegree.has(e.target)) {
      childrenMap.get(e.source)!.push(nodeMap.get(e.target)!);
      inDegree.set(e.target, inDegree.get(e.target)! + 1);
    }
  });

  // 2. Tìm các Node Gốc (Root Nodes - không có edge nào trỏ tới)
  const roots = nodes.filter(n => inDegree.get(n.id) === 0);
  
  // Sắp xếp các root nodes theo order_index hoặc id
  roots.sort((a, b) => {
    const orderA = (a.data?.order_index as number) || 0;
    const orderB = (b.data?.order_index as number) || 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.id.localeCompare(b.id);
  });

  const layoutedNodes: Node[] = [];
  let currentY = 0;
  let nodeSequence = 0;

  // 3. DFS để gán tọa độ
  const visited = new Set<string>();

  const layoutDFS = (node: Node) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    // Tính toán X: Gốc ở giữa (0), các node con so le trái phải
    let x = 0;
    if (nodeSequence > 0) {
      x = (nodeSequence % 2 === 1) ? -X_OFFSET : X_OFFSET;
    }

    const newNode = {
      ...node,
      position: { x, y: currentY }
    };
    layoutedNodes.push(newNode);

    currentY += Y_SPACING;
    nodeSequence++;

    // Duyệt tiếp các con
    const children = childrenMap.get(node.id) || [];
    // Sắp xếp con theo order
    children.sort((a, b) => {
      const orderA = (a.data?.order_index as number) || 0;
      const orderB = (b.data?.order_index as number) || 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });

    children.forEach(c => layoutDFS(c));
  };

  // 4. Chạy thuật toán cho từng cụm rễ
  roots.forEach((root, idx) => {
    if (idx > 0) {
      currentY += COMPONENT_GAP; // Khoảng cách ngăn giữa 2 cụm độc lập
      nodeSequence = 0; // Đặt lại sequence khởi đầu là ở giữa màn
    }
    layoutDFS(root);
  });

  // 5. Xử lý các node bị sót (chu trình hoặc không kết nối)
  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      currentY += COMPONENT_GAP;
      nodeSequence = 0;
      layoutDFS(n);
    }
  });

  return { nodes: layoutedNodes, edges };
};
