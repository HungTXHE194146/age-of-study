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
  volume_number?: number | null;
  week_number?: number | null;
  children?: Node[];
  // Student specific data
  best_xp?: number;
  node_status?: string;
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
 * @param gradeLevel Mã khối học (vd: "1", "2", ...)
 */
export async function fetchGradeSkillTree(gradeLevel: string) {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // 1. Lấy danh sách môn học thuộc khối này
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .eq('grade_level', gradeLevel)
      .order('name', { ascending: true });

    if (subjectsError) {
      console.error('Error fetching subjects for grade:', subjectsError);
      return [];
    }

    if (!subjects || subjects.length === 0) return [];

    // 2. Với mỗi môn học, lấy danh sách nodes
    const results = await Promise.all(subjects.map(async (subject: Subject) => {
      const { nodes } = await fetchSubjectSkillTree(subject.id);
      return {
        ...subject,
        nodes: buildSkillTree(nodes)
      };
    }));

    return results;
  } catch (error) {
    console.error('Error in fetchGradeSkillTree:', error);
    throw error;
  }
}

/**
 * Server-side function: Lấy toàn bộ cây kỹ năng của một môn học
 * @param subjectId ID của môn học
 * @param studentId ID của học sinh (để lấy tiến độ XP)
 * @param volumeNumber Optional volume number (1 or 2) for subjects with volumes
 */
export async function fetchSubjectSkillTree(subjectId: number, studentId?: string, volumeNumber?: number): Promise<{
  subject: Subject | null;
  nodes: Node[];
}> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Lấy thông tin môn học
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .single();

    if (subjectError) {
      console.error('Error fetching subject:', subjectError);
      return { subject: null, nodes: [] };
    }

    // Lấy danh sách tất cả các nodes thuộc môn học đó
    let query;
    
    if (studentId) {
      // Chế độ học sinh: Lấy nodes kèm theo tiến độ của học sinh cụ thể
      query = supabase
        .from('nodes')
        .select(`
          *,
          student_node_progress!left (
            score,
            status
          )
        `)
        .eq('subject_id', subjectId)
        .eq('student_node_progress.student_id', studentId);
    } else {
      // Chế độ giáo viên: Chỉ lấy thông tin nodes (Performance fix: Skip heavy join)
      query = supabase
        .from('nodes')
        .select('*')
        .eq('subject_id', subjectId);
    }

    // Filter by volume and lesson type when volume is specified
    if (volumeNumber) {
      query = query.eq('node_type', 'lesson').eq('volume_number', volumeNumber);
    }

    const { data: nodesData, error: nodesError } = await query
      .order('order_index', { ascending: true });

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      throw new Error(`Failed to fetch nodes: ${nodesError.message}`);
    }

    // Map data to Node interface
    const nodes: Node[] = (nodesData || []).map((n: any) => {
      // Handle potential join data from student mode
      const progress = n.student_node_progress?.[0];
      return {
        ...n,
        best_xp: progress?.score ? parseFloat(progress.score) : 0,
        node_status: progress?.status || 'locked'
      };
    });

    return {
      subject,
      nodes
    };
  } catch (error) {
    console.error('Error in fetchSubjectSkillTree:', error);
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