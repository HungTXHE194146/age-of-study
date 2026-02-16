// Định nghĩa interface Node để match với database schema
interface Node {
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
 * Chuyển đổi mảng phẳng các node thành cấu trúc cây lồng nhau
 * @param nodes Mảng phẳng các node từ database
 * @returns Cấu trúc cây với property children
 */
export function buildSkillTree(nodes: Node[]): Node[] {
  // Tạo bản đồ để tra cứu nhanh các node theo id
  const nodeMap = new Map<number, Node>();
  const rootNodes: Node[] = [];

  // Khởi tạo tất cả các node với children rỗng
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Xây dựng cây bằng cách gán các node vào parent tương ứng
  nodes.forEach(node => {
    const currentNode = nodeMap.get(node.id)!;
    
    if (node.parent_node_id === null || node.parent_node_id === undefined) {
      // Node gốc (không có parent)
      rootNodes.push(currentNode);
    } else {
      // Node con, tìm parent và thêm vào children
      const parent = nodeMap.get(node.parent_node_id);
      if (parent) {
        parent.children!.push(currentNode);
      }
    }
  });

  // Sắp xếp các node theo order_index
  const sortNodes = (nodesToSort: Node[]): Node[] => {
    return nodesToSort
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .map(node => ({
        ...node,
        children: sortNodes(node.children || [])
      }));
  };

  return sortNodes(rootNodes);
}

/**
 * Tìm một node cụ thể trong cây theo id
 * @param tree Cấu trúc cây đã được build
 * @param nodeId Id của node cần tìm
 * @returns Node nếu tìm thấy, null nếu không
 */
export function findNodeInTree(tree: Node[], nodeId: number): Node | null {
  for (const node of tree) {
    if (node.id === nodeId) {
      return node;
    }
    
    if (node.children && node.children.length > 0) {
      const found = findNodeInTree(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Lấy đường dẫn từ root đến một node cụ thể
 * @param tree Cấu trúc cây đã được build
 * @param nodeId Id của node cần tìm đường dẫn
 * @returns Mảng các node từ root đến node đích
 */
export function getNodePath(tree: Node[], nodeId: number): Node[] {
  const path: Node[] = [];
  
  const findPath = (nodes: Node[], targetId: number): boolean => {
    for (const node of nodes) {
      path.push(node);
      
      if (node.id === targetId) {
        return true;
      }
      
      if (node.children && node.children.length > 0) {
        if (findPath(node.children, targetId)) {
          return true;
        }
      }
    }
    return false;
  };

  findPath(tree, nodeId);
  return path;
}
