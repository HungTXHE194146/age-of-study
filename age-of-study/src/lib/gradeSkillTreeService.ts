import { getSupabaseBrowserClient } from '@/lib/supabase';

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

// Định nghĩa interface Subject để match với database schema
export interface Subject {
  id: number;
  name: string;
  code: string;
  grade_level: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Server-side function: Lấy toàn bộ cây kỹ năng của một khối học
 * @param gradeCode Mã khối học (ví dụ: "10", "11", "12")
 * @returns Cấu trúc dữ liệu gồm Node Gốc (Khối) -> Các Node Môn học -> Các Node bài học con
 */
export async function fetchGradeSkillTree(gradeCode: string): Promise<{
  gradeNode: Node;
  subjects: Subject[];
  nodes: Node[];
}> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Lấy danh sách các môn học thuộc khối
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .eq('grade_level', gradeCode)
      .order('name', { ascending: true });

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError);
      throw new Error(`Failed to fetch subjects: ${subjectsError.message}`);
    }

    if (!subjects || subjects.length === 0) {
      return {
        gradeNode: {
          id: 0,
          title: `Khối ${gradeCode}`,
          description: `Các môn học thuộc khối ${gradeCode}`,
          parent_node_id: null,
          node_type: 'grade',
          required_xp: 0,
          position_x: 0,
          position_y: 0,
          order_index: 0,
          children: []
        },
        subjects: [],
        nodes: []
      };
    }

    // Lấy danh sách tất cả các nodes thuộc các môn học đó
    const subjectIds = subjects.map((s: Subject) => s.id);
    const { data: nodes, error: nodesError } = await supabase
      .from('nodes')
      .select('*')
      .in('subject_id', subjectIds)
      .order('order_index', { ascending: true });

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      throw new Error(`Failed to fetch nodes: ${nodesError.message}`);
    }

    // Xây dựng cấu trúc cây kỹ năng cho từng môn học
    const subjectNodes: Node[] = [];
    subjects.forEach((subject: Subject) => {
      const subjectNode: Node = {
        id: subject.id,
        title: subject.name,
        description: subject.description || '',
        parent_node_id: null,
        node_type: 'subject',
        required_xp: 0,
        position_x: 0,
        position_y: 0,
        order_index: subject.id,
        children: []
      };
      subjectNodes.push(subjectNode);
    });

    // Xây dựng cây kỹ năng đầy đủ
    const allNodes = [...subjectNodes, ...(nodes || [])];
    const skillTree = buildSkillTree(allNodes);

    // Tạo node gốc cho khối học
    const gradeNode: Node = {
      id: 0,
      title: `Khối ${gradeCode}`,
      description: `Các môn học thuộc khối ${gradeCode}`,
      parent_node_id: null,
      node_type: 'grade',
      required_xp: 0,
      position_x: 0,
      position_y: 0,
      order_index: 0,
      children: skillTree
    };

    return {
      gradeNode,
      subjects: subjects || [],
      nodes: allNodes
    };
  } catch (error) {
    console.error('Error in fetchGradeSkillTree:', error);
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