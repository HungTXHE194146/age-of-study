"use client";

import React, { useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
  ConnectionMode,
  ConnectionLineType,
  NodeProps,
  Handle,
  EdgeProps,
  getBezierPath,
  BaseEdge,
  BackgroundVariant,
  Connection,
  addEdge,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  BookOpen,
  Lock,
  Star,
  Trophy,
  Video,
  FileText,
  Edit2,
  Trash2,
} from "lucide-react";
import { transformDBNodesToFlow } from "@/utils/skillTreeMapper";
import { updateNodeConnection, updateNodePositions } from "@/actions/skillTreeActions";

export interface CustomNodeData extends Record<string, unknown> {
  id: number | string;
  title: string;
  nodeType: string;
  color: string;
  isLocked: boolean;
  isTeacherMode?: boolean; // Prop mới để biết là giáo viên
}

export type CustomNodeType = Node<CustomNodeData, "custom">;

interface VisualSkillTreeProps {
  gradeCode: string;
  isTeacherMode?: boolean;
  subjectNodes?: { id: number; title: string; node_type: string; parent_node_id?: number | null; position_x?: number; position_y?: number; order_index: number }[];
}

// --- STYLED CUSTOM NODE COMPONENT ---
const CustomNode: React.FC<NodeProps<CustomNodeType>> = ({
  data,
  selected,
}) => {
  const isTeacher = data.isTeacherMode || false;
  // Ràng buộc logic: Nếu là giáo viên -> luôn luôn KHÔNG khóa
  const isLocked = isTeacher ? false : data.isLocked || false;
  const baseColor = isLocked ? "#9ca3af" : data.color || "#fbbf24";
  const router = useRouter();

  const Icon = useMemo(() => {
    if (isLocked) return Lock;
    switch (data.nodeType) {
      case "grade":
        return Trophy;
      case "subject":
        return BookOpen;
      case "chapter":
        return Star;
      case "lesson":
        return Video;
      default:
        return FileText;
    }
  }, [data.nodeType, isLocked]);

  const nodeStyle = {
    boxShadow: selected
      ? `0 0 20px 5px ${baseColor}, 0 10px 15px -3px rgba(0,0,0,0.3)`
      : `0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px ${baseColor}80`,
    borderColor: baseColor,
    background: isLocked
      ? "linear-gradient(145deg, #e5e7eb, #9ca3af)"
      : `linear-gradient(145deg, #ffffff, ${baseColor}20)`,
  };

  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-none"
      />

      <div
        style={nodeStyle}
        className={`relative w-36 h-36 rounded-[2rem] border-[6px] flex flex-col items-center justify-center p-2 transition-all duration-300 ease-out
          ${!isLocked ? "hover:scale-110 hover:-translate-y-2" : "opacity-90"}
          ${selected ? "scale-105 -translate-y-1" : ""}
        `}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-inner border-4 border-white/50 ${isLocked ? "bg-gray-300" : "bg-white"}`}
          style={{ color: baseColor }}
        >
          <Icon
            size={32}
            strokeWidth={2.5}
            className={`${!isLocked ? "group-hover:animate-wiggle" : ""}`}
          />
        </div>

        <div className="text-center px-1">
          <h3
            className={`text-sm font-extrabold leading-tight line-clamp-2 ${isLocked ? "text-gray-600" : "text-gray-800"}`}
            style={{
              textShadow:
                "1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff",
            }}
          >
            {data.title}
          </h3>
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-gray-900/40 rounded-[1.8rem] flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
            <Lock size={48} className="text-white/80 drop-shadow-lg" />
          </div>
        )}

        {/* --- NÚT QUẢN LÝ CỦA GIÁO VIÊN (Chỉ hiện khi hover) --- */}
        {isTeacher && (
          <div className="absolute -top-4 -right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/teacher/nodes/edit/${data.id}`);
              }} // ĐƯỜNG DẪN GIẢ SỬA
              className="w-8 h-8 bg-blue-500 hover:bg-blue-400 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                alert(`Gọi API Xóa Node ID: ${data.id}`);
              }} // LOGIC GIẢ XÓA
              className="w-8 h-8 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-none"
      />
    </div>
  );
};

// --- STYLED CUSTOM EDGE COMPONENT ---
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
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });
  const edgeColor = (data?.color as string) || "#fbbf24";

  return (
    <>
      <svg
        style={{ position: "absolute", top: 0, left: 0, height: 0, width: 0 }}
      >
        <defs>
          <filter
            id={`glow-${id}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 6,
          stroke: edgeColor,
          strokeOpacity: 0.6,
          filter: `url(#glow-${id})`,
        }}
      />
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: "#fff",
          strokeOpacity: 0.8,
          fill: "none",
        }}
      />
      <circle r="6" fill="#fff" filter={`url(#glow-${id})`}>
        <animateMotion
          dur="3s"
          repeatCount="indefinite"
          path={edgePath}
          calcMode="linear"
        />
      </circle>
    </>
  );
};

// --- MAIN COMPONENT ---
const VisualSkillTree: React.FC<VisualSkillTreeProps> = ({
  gradeCode,
  isTeacherMode = false,
  subjectNodes,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // DÙNG USEEFFECT ĐỂ LOAD DỮ LIỆU ĐỘNG THEO KHỐI (GRADE)
  useEffect(() => {
    // Nếu có subjectNodes (dữ liệu thật), dùng mapper để chuyển đổi
    if (subjectNodes && subjectNodes.length > 0) {
      const { nodes: mappedNodes, edges: mappedEdges } = transformDBNodesToFlow(subjectNodes, isTeacherMode);
      setNodes(mappedNodes);
      setEdges(mappedEdges);
    } else {
      // TẠM THỜI MOCK DATA ĐỂ BẠN THẤY SỰ THAY ĐỔI THEO KHỐI
      // Khi ráp API thật, bạn thay thế hàm mock này bằng API của bạn.
      const loadMockDataByGrade = () => {
        let mockNodes: CustomNodeType[] = [];
        let mockEdges: Edge[] = [];

        if (gradeCode === "5") {
          mockNodes = [
            {
              id: "g5",
              type: "custom",
              position: { x: 500, y: 50 },
              data: {
                id: "g5",
                title: "Khối 5 - Hành Trình Cuối",
                nodeType: "grade",
                color: "#f59e0b",
                isLocked: false,
                isTeacherMode,
              },
            },
            {
              id: "s5-math",
              type: "custom",
              position: { x: 300, y: 250 },
              data: {
                id: "s5-math",
                title: "Toán 5",
                nodeType: "subject",
                color: "#3b82f6",
                isLocked: false,
                isTeacherMode,
              },
            },
            {
              id: "c5-math-1",
              type: "custom",
              position: { x: 300, y: 450 },
              data: {
                id: "c5-math-1",
                title: "Chương 1: Phân số",
                nodeType: "chapter",
                color: "#3b82f6",
                isLocked: true,
                isTeacherMode,
              },
            }, // Để màu xám (bị khóa)
          ];
          mockEdges = [
            {
              id: "e1",
              source: "g5",
              target: "s5-math",
              type: "custom",
              data: { color: "#3b82f6" },
            },
            {
              id: "e2",
              source: "s5-math",
              target: "c5-math-1",
              type: "custom",
              data: { color: "#3b82f6" },
            },
          ];
        } else {
          // Data giả cho khối khác (Ví dụ Khối 4)
          mockNodes = [
            {
              id: "gx",
              type: "custom",
              position: { x: 500, y: 50 },
              data: {
                id: "gx",
                title: `Khối ${gradeCode} - Khởi Hành`,
                nodeType: "grade",
                color: "#10b981",
                isLocked: false,
                isTeacherMode,
              },
            },
            {
              id: "sx-viet",
              type: "custom",
              position: { x: 500, y: 250 },
              data: {
                id: "sx-viet",
                title: `Tiếng Việt ${gradeCode}`,
                nodeType: "subject",
                color: "#ef4444",
                isLocked: false,
                isTeacherMode,
              },
            },
          ];
          mockEdges = [
            {
              id: "ex1",
              source: "gx",
              target: "sx-viet",
              type: "custom",
              data: { color: "#ef4444" },
            },
          ];
        }

        setNodes(mockNodes);
        setEdges(mockEdges);
      };

      loadMockDataByGrade();
    }
  }, [gradeCode, isTeacherMode, subjectNodes, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  // Xử lý sự kiện kéo nối dây (onConnect)
  const onConnect = useCallback(async (params: Connection) => {
    if (!isTeacherMode) return;

    try {
      const result = await updateNodeConnection(
        parseInt(params.source!),
        parseInt(params.target!)
      );

      if (result.success) {
        // Vẽ dây mới lên màn hình ngay lập tức
        setEdges((eds) => addEdge(params, eds));
      } else {
        console.error("Failed to update node connection:", result.error);
      }
    } catch (error) {
      console.error("Error in onConnect:", error);
    }
  }, [isTeacherMode, setEdges]);

  // Xử lý sự kiện thả chuột sau khi di chuyển (onNodeDragStop)
  const onNodeDragStop = useCallback(async (event: React.MouseEvent, node: CustomNodeType, nodes: CustomNodeType[]) => {
    if (!isTeacherMode) return;

    try {
      // Lọc các node đang được chọn
      const selectedNodes = nodes.filter(n => n.selected === true);
      
      // Map thành định dạng yêu cầu
      const positions = selectedNodes.map(n => ({
        id: parseInt(n.id),
        x: Math.round(n.position.x),
        y: Math.round(n.position.y)
      }));

      if (positions.length > 0) {
        // Gọi Server Action để lưu tọa độ mới vào Database
        const result = await updateNodePositions(positions);
        
        if (!result.success) {
          console.error("Failed to update node positions:", result.error);
        }
      }
    } catch (error) {
      console.error("Error in onNodeDragStop:", error);
    }
  }, [isTeacherMode]);

  return (
    <div className="w-full h-full bg-transparent relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
        connectionMode={ConnectionMode.Strict}
        connectionLineType={ConnectionLineType.Bezier}
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        selectionMode={isTeacherMode ? SelectionMode.Partial : undefined}
      >
        <MiniMap
          className="!bg-slate-800 !border-slate-700 rounded-lg shadow-xl"
          nodeColor={(node) => {
            const customNode = node as CustomNodeType;
            const isTeacher = customNode.data.isTeacherMode || false;
            const isNodeLocked = isTeacher
              ? false
              : customNode.data.isLocked || false;

            return isNodeLocked
              ? "#4b5563"
              : customNode.data.color || "#fbbf24";
          }}
          maskColor="rgba(15, 23, 42, 0.6)"
        />
        <Controls className="!bg-slate-800 !border-slate-700 !text-white rounded-lg shadow-xl" />
        <Background
          color="#818cf8"
          gap={32}
          size={1}
          variant={BackgroundVariant.Dots}
          className="opacity-20"
        />
      </ReactFlow>
    </div>
  );
};

export default VisualSkillTree;
