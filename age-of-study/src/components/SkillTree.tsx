import { fetchSubjectSkillTree } from '@/lib/skillTreeService';
import { useEffect, useState, useMemo } from 'react';
import SkillNode from './SkillNode';
import { Virtuoso } from 'react-virtuoso';

interface SkillTreeProps {
  subjectId: number;
}

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

function flattenTree(nodes: Node[], level = 0): { node: Node; level: number }[] {
  let result: { node: Node; level: number }[] = [];
  for (const node of nodes) {
    result.push({ node, level });
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenTree(node.children, level + 1));
    }
  }
  return result;
}

export default function SkillTree({ subjectId }: SkillTreeProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSkillTree() {
      try {
        setLoading(true);
        setError(null);
        
        const skillTree = await fetchSubjectSkillTree(subjectId);
        setNodes(skillTree);
      } catch (err) {
        console.error('Error loading skill tree:', err);
        setError('Failed to load skill tree. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (subjectId) {
      loadSkillTree();
    }
  }, [subjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading skill tree...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No skill tree data available for this subject.
      </div>
    );
  }

  const flatData = useMemo(() => flattenTree(nodes), [nodes]);

  return (
    <div className="h-[600px] w-full border rounded-xl bg-white/50 p-4">
      <Virtuoso
        style={{ height: '100%', width: '100%' }}
        data={flatData}
        itemContent={(_, item) => (
          <div className="py-1">
            <SkillNode
              key={item.node.id}
              node={item.node}
              level={item.level}
              disableRecursion={true}
            />
          </div>
        )}
      />
    </div>
  );
}