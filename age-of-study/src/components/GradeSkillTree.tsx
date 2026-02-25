import React, { useState, useEffect } from "react";
import { Node } from "@/lib/gradeSkillTreeService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Book,
  Target,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  Users,
  Award,
} from "lucide-react";

interface GradeSkillTreeProps {
  gradeCode: string;
}

const GradeSkillTree: React.FC<GradeSkillTreeProps> = ({ gradeCode }) => {
  const [gradeData, setGradeData] = useState<{
    gradeNode: Node;
    subjects: { id: number; name: string; code: string }[];
    nodes: Node[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  useEffect(() => {
    const fetchGradeTree = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/grade-skill-tree?grade=${gradeCode}`,
        );
        const data = await response.json();

        if (response.ok) {
          setGradeData(data);
          // Expand root node by default
          setExpandedNodes(new Set([0]));
        } else {
          console.error("Failed to fetch grade skill tree:", data.error);
        }
      } catch (error) {
        console.error("Error fetching grade skill tree:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGradeTree();
  }, [gradeCode]);

  const toggleNode = (nodeId: number) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    setExpandedNodes(newExpandedNodes);
  };

  const selectNode = (nodeId: number) => {
    setSelectedNode(nodeId);
  };

  const renderNode = (node: Node, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id} className="mb-2">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
            isSelected
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleNode(node.id)}
              className="p-1 hover:bg-transparent"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </Button>
          )}

          {/* Node Icon */}
          <div className="flex-shrink-0">
            {node.node_type === "grade" ? (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
            ) : node.node_type === "subject" ? (
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <Book className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {node.title}
              </h4>
              <Badge variant="outline" className="text-xs">
                {node.node_type}
              </Badge>
              {node.required_xp > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {node.required_xp} XP
                </Badge>
              )}
            </div>
            {node.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {node.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {node.node_type !== "grade" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectNode(node.id)}
                  className="text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Hoàn thành
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Học ngay
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
            {node.children?.map((childNode) =>
              renderNode(childNode, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Đang tải cây kỹ năng...</span>
      </div>
    );
  }

  if (!gradeData) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Không tìm thấy dữ liệu
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Không có môn học nào trong khối {gradeCode}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {gradeData.gradeNode.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {gradeData.gradeNode.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {gradeData.subjects.length} môn học
            </Badge>
            <Badge variant="outline" className="text-sm">
              {gradeData.nodes.length} bài học
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Khối Học
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {gradeCode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Book className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Môn Học
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {gradeData.subjects.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Bài Học
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {gradeData.nodes.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Tổng XP
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {gradeData.nodes.reduce(
                  (sum, node) => sum + (node.required_xp || 0),
                  0,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tree View */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bản Đồ Kỹ Năng
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set([0]))}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Mở rộng
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set())}
              className="text-xs"
            >
              <Minus className="w-3 h-3 mr-1" />
              Thu gọn
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {gradeData.gradeNode.children?.map((node) => renderNode(node))}
        </div>
      </div>
    </div>
  );
};

export default GradeSkillTree;
