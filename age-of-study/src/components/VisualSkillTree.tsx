import React, { useState, useEffect, useCallback } from "react";
import { Node } from "@/lib/gradeSkillTreeService";
import { useAuthStore } from "@/store/useAuthStore";
import { Badge } from "@/components/ui/badge";
import { Subject } from "@/types/teacher";
import {
  GraduationCap,
  Book,
  Target,
  Star,
  Zap,
  Lock,
  Unlock,
} from "lucide-react";
import {
  ReactFlow,
  ReactFlowProvider,
  Node as RFNode,
  Edge as RFEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  NodeProps,
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  BackgroundVariant,
  Position,
  ConnectionMode,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// 1. Custom Data Payload (Chỉ chứa dữ liệu của ứng dụng)
export interface CustomNodeData extends Record<string, unknown> {
  title: string;
  description?: string;
  nodeType: string;
  color: string;
  isLocked: boolean;
  // Các trường sau thuộc về UI của Node, có thể giữ lại nếu cần thiết
  width?: number;
  height?: number;
}
// 2. Custom Node Type (Kết hợp Node của React Flow và Custom Data)
export type CustomNodeType = RFNode<CustomNodeData, 'custom'>;



interface VisualSkillTreeProps {
  gradeCode: string;
}

// Subject colors for different branches
const SUBJECT_COLORS = {
  Toán: "#10b981", // Emerald Green
  "Tiếng Việt": "#ef4444", // Red
  "Tiếng Anh": "#eab308", // Yellow
  "Khoa học": "#3b82f6", // Blue
  "Lịch sử": "#a855f7", // Purple
  "Địa lý": "#f59e0b", // Orange
  "Âm nhạc": "#ec4899", // Pink
  "Mỹ thuật": "#14b8a6", // Cyan
  "Thể dục": "#8b5cf6", // Indigo
  default: "#6b7280", // Gray for unknown subjects
};

const SkillTreeContent: React.FC<VisualSkillTreeProps> = ({ gradeCode }) => {
  const { user } = useAuthStore();
  const [gradeData, setGradeData] = useState<{
    gradeNode: Node;
    subjects: Subject[];
    nodes: Node[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"radial" | "tree" | "network">(
    "network",
  );

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([]);
  const { fitView } = useReactFlow();

  // Get subject color based on subject name
  const getSubjectColor = (subjectName: string): string => {
    return (
      SUBJECT_COLORS[subjectName as keyof typeof SUBJECT_COLORS] ||
      SUBJECT_COLORS.default
    );
  };

  // Get node icon based on node type
  const getNodeIcon = (nodeType: string, subjectName?: string) => {
    switch (nodeType) {
      case "grade":
        return <GraduationCap className="w-6 h-6" />;
      case "subject":
        return <Book className="w-6 h-6" />;
      default:
        return <Target className="w-6 h-6" />;
    }
  };

  // Build React Flow nodes and edges from grade data
  const buildFlowData = useCallback(
    (data: { gradeNode: Node; subjects: Subject[]; nodes: Node[] }) => {
      const rfNodes: CustomNodeType[] = [];
      const rfEdges: RFEdge[] = [];

      if (!data || !data.gradeNode) return { nodes: rfNodes, edges: rfEdges };

      // Add grade node (center)
      const gradeNode: CustomNodeType = {
        id: `grade-${data.gradeNode.id}`,
        type: "custom",
        position: { x: 500, y: 600 }, // Center bottom
        data: {
          ...data.gradeNode,
          nodeType: "grade",
          color: "#6b7280",
          isLocked: false,
        },
        style: {
          width: 80,
          height: 80,
          background: "transparent",
          border: "2px solid #6b7280",
          boxShadow: "0 0 20px rgba(107, 114, 128, 0.5)",
          transition: "all 0.3s ease",
        },
      };
      rfNodes.push(gradeNode);

      // Add subject nodes
      const subjects = data.subjects || [];
      const centerX = 500;
      const centerY = 300;
      const radius = 200;

      subjects.forEach((subject: Subject, index: number) => {
        const angle = (index / subjects.length) * (2 * Math.PI);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        const subjectNode: CustomNodeType = {
          id: `subject-${subject.id}`,
          type: "custom",
          position: { x, y },
          data: {
            id: subject.id,
            title: subject.name,
            description: subject.description,
            nodeType: "subject",
            color: getSubjectColor(subject.name),
            isLocked: false,
          },
          style: {
            width: 70,
            height: 70,
            background: "transparent",
            border: `2px solid ${getSubjectColor(subject.name)}`,
            boxShadow: `0 0 15px ${getSubjectColor(subject.name)}50`,
            transition: "all 0.3s ease",
          },
        };
        rfNodes.push(subjectNode);

        // Add edge from grade to subject
        const subjectEdge: RFEdge = {
          id: `edge-grade-${subject.id}`,
          source: `grade-${data.gradeNode.id}`,
          target: `subject-${subject.id}`,
          type: "smoothstep",
          animated: true,
          style: {
            stroke: getSubjectColor(subject.name),
            strokeWidth: 3,
            strokeDasharray: "5,5",
            opacity: 0.8,
          } as React.CSSProperties,
        };
        rfEdges.push(subjectEdge);
      });

      // Add lesson nodes and edges
      const lessons = data.nodes || [];
      const processedLessonIds = new Set<number>();
      lessons.forEach((lesson: Node) => {
        // Skip duplicate lessons
        if (processedLessonIds.has(lesson.id)) {
          return;
        }
        processedLessonIds.add(lesson.id);
        // Find parent node
        let parentNodeId = "";
        if (lesson.parent_node_id) {
          if (lesson.node_type === "subject") {
            parentNodeId = `grade-${data.gradeNode.id}`;
          } else {
            parentNodeId = `subject-${lesson.parent_node_id}`;
          }
        }

        // Position lessons relative to their parent
        const parentNode = rfNodes.find((n) => n.id === parentNodeId);
        let position = { x: lesson.position_x || 0, y: lesson.position_y || 0 };

        if (parentNode) {
          // Offset position based on parent
          position = {
            x: parentNode.position.x + (lesson.position_x || 50),
            y: parentNode.position.y + (lesson.position_y || 80),
          };
        }

        const lessonNode: CustomNodeType = {
          id: `lesson-${lesson.id}`,
          type: "custom",
          position,
          data: {
            ...lesson,
            nodeType: lesson.node_type,
            color: parentNode?.data.color || "#6b7280",
            isLocked: false, // TODO: Implement locking logic
          },
          style: {
            width: 60,
            height: 60,
            background: "transparent",
            border: `2px solid ${parentNode?.data.color || "#6b7280"}`,
            boxShadow: `0 0 10px ${parentNode?.data.color || "#6b7280"}30`,
            opacity: 0.8,
            transition: "all 0.3s ease",
          },
        };
        rfNodes.push(lessonNode);

        // Add edge from parent to lesson
        if (parentNodeId) {
          const lessonEdge: RFEdge = {
            id: `edge-${parentNodeId}-${lesson.id}`,
            source: parentNodeId,
            target: `lesson-${lesson.id}`,
            type: "smoothstep",
            animated: true,
            style: {
              stroke: parentNode?.data.color || "#6b7280",
              strokeWidth: 2,
              strokeDasharray: "3,3",
              opacity: 0.6,
            } as React.CSSProperties,
          };
          rfEdges.push(lessonEdge);
        }
      });

      return { nodes: rfNodes, edges: rfEdges };
    },
    [],
  );

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
          const flowData = buildFlowData(data);
          setNodes(flowData.nodes);
          setEdges(flowData.edges);

          // Fit view after data is loaded
          setTimeout(() => {
            fitView({ padding: 0.1 });
          }, 100);
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
  }, [gradeCode, buildFlowData, setNodes, setEdges, fitView]);

  const selectNode = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  // Custom Node Component for React Flow
  const CustomNode = ({ id, data, selected }: NodeProps<CustomNodeType>) => {
    const isLocked = data.isLocked || false;
    const nodeColor = data.color || "#6b7280";

    return (
      <div
        className={`relative group cursor-pointer transition-all duration-300 ${
          selected ? "scale-110" : "hover:scale-105"
        }`}
        style={{
          filter: isLocked ? "grayscale(100%)" : "none",
          opacity: isLocked ? 0.5 : 1,
        }}
      >
        {/* Node Glow Effect */}
        <div
          className="absolute inset-0 rounded-full blur-xl transition-all duration-300"
          style={{
            background: isLocked
              ? "none"
              : `radial-gradient(circle, ${nodeColor}60, transparent 70%)`,
            transform: selected ? "scale(1.5)" : "scale(1)",
            opacity: selected ? 0.8 : 0.3,
          }}
        ></div>

        {/* Node Border */}
        <div
          className="relative w-full h-full rounded-full border-2 transition-all duration-300"
          style={
            {
              borderColor: isLocked ? "#6b7280" : nodeColor,
              background: "rgba(0, 0, 0, 0.3)",
              boxShadow: selected
                ? `0 0 30px ${nodeColor}80`
                : isLocked
                  ? "none"
                  : `0 0 15px ${nodeColor}40`,
            } as React.CSSProperties
          }
        >
          {/* Node Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: isLocked
                  ? "rgba(107, 114, 128, 0.3)"
                  : `linear-gradient(135deg, ${nodeColor}20, ${nodeColor}60)`,
                border: `1px solid ${isLocked ? "#6b7280" : nodeColor}80`,
              }}
            >
              {isLocked ? (
                <Lock className="w-4 h-4 text-gray-400" />
              ) : (
                getNodeIcon(data.nodeType, data.title)
              )}
            </div>
          </div>

          {/* Node Label */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
            <div
              className="px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300"
              style={
                {
                  background: "rgba(0, 0, 0, 0.6)",
                  border: `1px solid ${isLocked ? "#6b7280" : nodeColor}40`,
                  color: isLocked ? "#9ca3af" : "white",
                } as React.CSSProperties
              }
            >
              {data.title}
            </div>
          </div>

          {/* Hover Overlay */}
          {!isLocked && (
            <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/5 transition-colors duration-300"></div>
          )}
        </div>
      </div>
    );
  };

  // Custom Edge Component for React Flow
  const CustomEdge: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
  }) => {
    const edgePath = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    return (
      <path
        id={id}
        style={{
          ...style,
          strokeDasharray: style.strokeDasharray || "5,5",
          animation: (style as { animated?: boolean }).animated
            ? "dash 2s linear infinite"
            : "none",
        }}
        className="react-flow__edge-path"
        d={edgePath[0]}
        markerEnd={markerEnd}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute -inset-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
        </div>
        <span className="ml-4 text-gray-400">Đang tải bản đồ kỹ năng...</span>
      </div>
    );
  }

  if (!gradeData) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-2xl">
          <Star className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Không tìm thấy dữ liệu
        </h3>
        <p className="text-gray-400">
          Không có môn học nào trong khối {gradeCode}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[700px]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>

      {/* Stats Header */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {gradeData.gradeNode.title}
        </h2>
        <p className="text-gray-400 mb-4">{gradeData.gradeNode.description}</p>
        <div className="flex justify-center gap-6 text-sm">
          <span className="text-blue-400">
            📚 {gradeData.subjects.length} môn học
          </span>
          <span className="text-purple-400">
            🎯 {gradeData.nodes.length} bài học
          </span>
          <span className="text-yellow-400">
            ⭐{" "}
            {gradeData.nodes.reduce(
              (sum, node) => sum + (node.required_xp || 0),
              0,
            )}{" "}
            XP
          </span>
        </div>
      </div>

      {/* React Flow Visualization */}
      <div className="h-[600px] w-full rounded-xl border border-white/20 bg-gradient-to-br from-gray-900 via-blue-900/50 to-purple-900/50 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={{ custom: CustomNode }}
          edgeTypes={{ custom: CustomEdge }}
          fitView
          attributionPosition="top-right"
          style={{ background: "transparent" }}
          connectionMode={ConnectionMode.Strict}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{
            stroke: "#000000",
            strokeWidth: 2,
            strokeDasharray: "5,5",
          } as React.CSSProperties}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#334155"
          />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              // Ép kiểu an toàn
              const customNode = node as CustomNodeType;
              return customNode.data.color || "#6b7280";
            }}
            nodeStrokeWidth={2}
            maskColor="rgba(0, 0, 0, 0.5)"
          />
        </ReactFlow>
      </div>

      {/* Selected Node Info */}
      {selectedNode && gradeData.nodes.find((n) => n.id.toString() === selectedNode) && (
        <div className="fixed bottom-8 right-8 bg-black/50 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Đang chọn</h4>
              <p className="text-xs text-gray-400">Node ID: {selectedNode}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Loại:</span>
              <span className="text-white font-medium capitalize">
                {gradeData.nodes.find((n) => n.id.toString() === selectedNode)?.node_type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">XP yêu cầu:</span>
              <span className="text-yellow-400 font-medium">
                {gradeData.nodes.find((n) => n.id.toString() === selectedNode)
                  ?.required_xp || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Vị trí:</span>
              <span className="text-white font-medium">
                {gradeData.nodes.find((n) => n.id.toString() === selectedNode)
                  ?.position_x || 0}
                ,
                {gradeData.nodes.find((n) => n.id.toString() === selectedNode)
                  ?.position_y || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Môn học:</span>
              <span className="text-blue-400 font-medium">
                {gradeData.subjects.find(
                  (s) =>
                    s.id ===
                    gradeData.nodes.find((n) => n.id.toString() === selectedNode)
                      ?.parent_node_id,
                )?.name || "N/A"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 bg-blue-500/20 text-blue-300 border border-blue-400/50 rounded-lg py-2 px-4 hover:bg-blue-500/30 transition-colors">
              Hoàn thành
            </button>
            <button className="flex-1 bg-green-500/20 text-green-300 border border-green-400/50 rounded-lg py-2 px-4 hover:bg-green-500/30 transition-colors">
              Học ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const VisualSkillTree: React.FC<VisualSkillTreeProps> = ({ gradeCode }) => {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <SkillTreeContent gradeCode={gradeCode} />
      </ReactFlowProvider>
    </div>
  );
};

export default VisualSkillTree;
