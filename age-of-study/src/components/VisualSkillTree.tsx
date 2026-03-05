"use client";

import React, { useMemo, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";
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
  ReactFlowInstance,
  PanOnScrollMode,
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
  Search,
  Target,
} from "lucide-react";
import { transformDBNodesToFlow } from "@/utils/skillTreeMapper";
import { updateNodeConnection, updateNodePositions } from "@/actions/skillTreeActions";
import { getLayoutedElements } from "@/utils/layoutUtils";
import { Panel } from "@xyflow/react";
import Loading from "@/components/ui/loading";

export interface CustomNodeData extends Record<string, unknown> {
  id: number | string;
  title: string;
  nodeType: string;
  color: string;
  isLocked: boolean;
  isCompleted?: boolean; // Mới: Đã hoàn thành hay chưa
  isTeacherMode?: boolean;
  onEditNode?: (nodeId: number) => void;
  onDeleteNode?: (nodeId: number) => void;
}

export type CustomNodeType = Node<CustomNodeData, "custom">;

interface VisualSkillTreeProps {
  gradeCode: string;
  isTeacherMode?: boolean;
  subjectNodes?: { id: number; title: string; node_type: string; parent_node_id?: number | null; position_x?: number; position_y?: number; order_index: number }[] | null;
  completedNodeIds?: number[]; // Mới: Các node đã hoàn thành
  onNodeSelected?: (id: string | number) => void;
  onEditNode?: (nodeId: number) => void;
  onDeleteNode?: (nodeId: number) => void;
}

// --- STYLED CUSTOM NODE COMPONENT ---
const CustomNode = React.memo(({
  data,
  selected,
}: NodeProps<CustomNodeType>) => {
  const isTeacher = data.isTeacherMode || false;
  const isLocked = isTeacher ? false : data.isLocked || false;
  const isCompleted = data.isCompleted || false;
  const baseColor = isLocked ? "#9ca3af" : data.color || "#fbbf24";

  const Icon = useMemo(() => {
    if (isLocked) return Lock;
    // switch (data.nodeType) ... (keep existing logic)
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

  const teacherStickyColor = (() => {
    switch (data.nodeType) {
      case "grade": return "#fef08a"; // yellow
      case "subject": return "#bbf7d0"; // green
      case "chapter": return "#bfdbfe"; // blue
      case "lesson": return "#fbcfe8"; // pink
      default: return "#fef08a";
    }
  })();

  const nodeStyle = isTeacher
    ? {
      boxShadow: selected
        ? `6px 6px 0 0 rgba(0,0,0,1)`
        : `4px 4px 0 0 rgba(0,0,0,1)`,
      borderColor: '#000',
      background: isLocked ? "#e5e7eb" : teacherStickyColor,
    }
    : {
      boxShadow: selected
        ? `0 0 20px 5px ${isCompleted ? "#22c55e" : baseColor}, 0 10px 15px -3px rgba(0,0,0,0.3)`
        : `0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px ${isCompleted ? "#22c55e" : baseColor}80`,
      borderColor: isCompleted ? "#22c55e" : baseColor, // Green ring if completed
      background: isLocked
        ? "linear-gradient(145deg, #e5e7eb, #9ca3af)"
        : isCompleted
          ? `linear-gradient(145deg, #f0fdf4, #dcfce7)` // Light green bg if completed
          : `linear-gradient(145deg, #ffffff, ${baseColor}20)`,
    };

  return (
    <div className="relative group">
      {/* (Handles logic stays the same) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`w-4 h-4 transition-all duration-200 ${isTeacher
          ? 'opacity-0 group-hover:opacity-100 bg-black cursor-pointer rounded-none border-2 border-white'
          : 'rounded-full border-2 border-white !bg-transparent !border-none'
          }`}
        style={{
          top: '-12px',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={`w-4 h-4 transition-all duration-200 ${isTeacher
          ? 'opacity-0 group-hover:opacity-100 bg-black cursor-pointer rounded-none border-2 border-white'
          : 'rounded-full border-2 border-white !bg-transparent !border-none'
          }`}
        style={{
          bottom: '-12px',
          left: '50%',
          transform: 'translate(-50%, 50%)'
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={`w-4 h-4 transition-all duration-200 ${isTeacher
          ? 'opacity-0 group-hover:opacity-100 bg-black cursor-pointer rounded-none border-2 border-white'
          : 'rounded-full border-2 border-white !bg-transparent !border-none'
          }`}
        style={{
          left: '-12px',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`w-4 h-4 transition-all duration-200 ${isTeacher
          ? 'opacity-0 group-hover:opacity-100 bg-black cursor-pointer rounded-none border-2 border-white'
          : 'rounded-full border-2 border-white !bg-transparent !border-none'
          }`}
        style={{
          right: '-12px',
          top: '50%',
          transform: 'translate(50%, -50%)'
        }}
      />

      <div
        style={nodeStyle}
        onClick={(e) => {
          if (!isTeacher && isLocked) {
            e.stopPropagation();
            return;
          }
        }}
        className={
          isTeacher
            ? `relative w-36 h-36 border-2 flex flex-col items-center justify-center p-2 transition-transform duration-200 will-change-transform
               ${!isLocked ? "hover:-translate-y-1" : ""}
               ${selected ? "scale-105 -rotate-2" : "rotate-1"}
              `
            : `relative w-32 h-32 rounded-[2rem] border-[3px] border-slate-800 flex flex-col items-center justify-center p-2 transition-all duration-300 ease-out notebook-lines will-change-transform
               ${!isLocked ? "hover:scale-105 hover:-translate-y-1 cursor-pointer" : "opacity-80 cursor-not-allowed"}
               ${selected ? "scale-105 -rotate-2 ring-4 ring-offset-2 ring-blue-500" : "rotate-1"}
              `
        }
      >
        {isTeacher && !isLocked && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-red-200/60 border border-red-300 rounded-sm italic z-0 transform -rotate-2"></div>
        )}

        <div
          className={
            isTeacher
              ? `w-12 h-12 flex items-center justify-center mb-1 z-10 ${isLocked ? "text-gray-400" : "text-gray-900"}`
              : `w-14 h-14 rounded-full flex items-center justify-center mb-2 border-2 border-slate-800 z-10 ${isLocked ? "bg-gray-200 opacity-60" : isCompleted ? "bg-green-300" : "bg-white"}`
          }
          style={{ color: isTeacher ? undefined : (isLocked ? "#64748b" : "#0f172a"), boxShadow: isTeacher ? "none" : "2px 2px 0 0 rgba(0,0,0,1)" }}
        >
          <Icon
            size={isTeacher ? 36 : 28}
            strokeWidth={isTeacher ? 2 : 2.5}
            className={`${!isLocked && !isTeacher ? "group-hover:animate-wiggle" : ""}`}
          />
        </div>

        <div className="text-center px-1 z-10 w-full">
          <h3
            className={
              isTeacher
                ? `text-sm font-bold leading-tight line-clamp-3 text-black font-handwritten tracking-wide`
                : `text-xs font-black leading-tight line-clamp-2 uppercase tracking-wide px-1 ${isLocked ? "text-slate-500" : "text-slate-900"}`
            }
            style={{
              textShadow: isTeacher ? "none" : "1px 1px 0 #fff",
            }}
          >
            {data.title}
          </h3>
          {isCompleted && !isTeacher && (
            <div className="mt-1 flex justify-center w-full">
              <div className="bg-green-400 text-slate-900 border-2 border-slate-800 text-[9px] uppercase font-black px-2 py-0.5 rounded shadow-[2px_2px_0_0_rgba(0,0,0,1)] transform rotate-2">
                HOÀN THÀNH
              </div>
            </div>
          )}
        </div>

        {!isTeacher && isLocked && (
          <div className="absolute inset-0 bg-slate-200/60 rounded-[1.8rem] flex items-center justify-center backdrop-blur-[1px] pointer-events-none z-20">
            <div className="w-12 h-12 bg-slate-100 border-2 border-slate-800 rounded-full flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <Lock size={24} className="text-slate-700" />
            </div>
          </div>
        )}


        {/* --- NÚT QUẢN LÝ CỦA GIÁO VIÊN (Chỉ hiện khi hover) --- */}
        {isTeacher && Number(data.id) > 0 && (
          <div className="absolute -top-4 -right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (data.onEditNode) data.onEditNode(Number(data.id));
              }}
              className="w-8 h-8 bg-white border-2 border-black text-black rounded-none flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
              title="Chỉnh sửa"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (data.onDeleteNode) data.onDeleteNode(Number(data.id));
              }}
              className="w-8 h-8 bg-red-100 border-2 border-black text-red-600 rounded-none flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// --- STYLED CUSTOM EDGE COMPONENT ---
const CustomEdge = React.memo(({
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
  selected,
  setEdges,
}: EdgeProps & { setEdges?: (callback: (eds: Edge[]) => Edge[]) => void }) => {
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
      {/* Nét chính của line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={
          data?.isTeacherMode
            ? {
              ...style,
              strokeWidth: 4,
              stroke: "#374151", // dark gray for pencil look
              strokeOpacity: 0.9,
              strokeDasharray: "8, 4", // dashed line for notebook feel
              fill: "none",
            }
            : { // NOTEBOOK STYLE FOR STUDENT
              ...style,
              strokeWidth: 4,
              stroke: "#1f2937", // Dark pen ink color
              strokeOpacity: 0.8,
              strokeDasharray: "6, 6", // Dashed pen look
              fill: "none",
            }
        }
      />
      {/* Nét sáng của line (chỉ cho student mode) */}
      {!data?.isTeacherMode && (
        <BaseEdge
          path={edgePath}
          style={{
            ...style,
            strokeWidth: 2,
            stroke: edgeColor,
            strokeOpacity: 0.5,
            fill: "none",
          }}
        />
      )}
      {!data?.isTeacherMode && (
        <circle r="6" fill="#fff" filter={!data?.isLowData ? `url(#global-glow)` : "none"}>
          {!data?.isLowData && (
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path={edgePath}
              calcMode="linear"
            />
          )}
        </circle>
      )}

      {/* Delete button for edges when selected */}
      {selected && (
        <foreignObject
          width={24}
          height={24}
          x={(sourceX + targetX) / 2 - 12}
          y={(sourceY + targetY) / 2 - 12}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: 'red',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              zIndex: 1000
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Handle edge deletion
              if (setEdges) {
                setEdges((eds: Edge[]) => eds.filter((edge: Edge) => edge.id !== id));
              }
            }}
          >
            <span style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>×</span>
          </div>
        </foreignObject>
      )}
    </>
  );
});

// --- MAIN COMPONENT ---
const VisualSkillTree: React.FC<VisualSkillTreeProps> = ({
  gradeCode,
  isTeacherMode = false,
  subjectNodes,
  completedNodeIds = [], // Mới
  onNodeSelected,
  onEditNode,
  onDeleteNode,
}) => {

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Lọc kết quả tìm kiếm dựa trên query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return nodes.filter(n => (n.data.title as string).toLowerCase().includes(query));
  }, [searchQuery, nodes]);

  const [isLowData, setIsLowData] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        setIsLowData(localStorage.getItem("low_data_mode_enabled") === "true");
      }
    };

    // Initial check
    handleStorageChange();

    // Listen for custom event from sidebar
    window.addEventListener("lowDataModeChanged", handleStorageChange);
    return () => {
      window.removeEventListener("lowDataModeChanged", handleStorageChange);
    };
  }, []);

  const handleSelectNode = useCallback((nodeId: string) => {
    const foundNode = nodes.find(n => n.id === nodeId);
    if (!foundNode || !rfInstance) return;

    if (!isTeacherMode && foundNode.data.isLocked) {
      return; // Không cho phép chọn nếu bị khóa ở màn học sinh
    }

    // Giữ nguyên mức zoom hiện tại, chỉ di chuyển center tới node
    const currentZoom = rfInstance.getZoom();
    rfInstance.setCenter(foundNode.position.x + 75, foundNode.position.y + 75, { zoom: currentZoom, duration: 800 });

    // Đánh dấu node được chọn
    setNodes(nds => nds.map(n => ({
      ...n,
      selected: n.id === foundNode.id
    })));

    if (onNodeSelected) {
      onNodeSelected(foundNode.id);
    }

    setSearchQuery(foundNode.data.title as string);
    setShowSuggestions(false);
  }, [nodes, rfInstance, setNodes, onNodeSelected, isTeacherMode]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectNode(searchResults[0].id);
    } else if (searchQuery.trim()) {
      alert("Không tìm thấy bài học phù hợp!");
    }
  };

  // DÙNG USEEFFECT ĐỂ LOAD DỮ LIỆU ĐỘNG THEO KHỐI (GRADE)
  useEffect(() => {
    // Nếu có subjectNodes (dữ liệu thật), dùng mapper để chuyển đổi
    if (subjectNodes) {
      const { nodes: mappedNodes, edges: mappedEdges } = transformDBNodesToFlow(
        subjectNodes,
        isTeacherMode || false,
        completedNodeIds
      );
      setNodes(mappedNodes);
      // Inject isLowData and isTeacherMode into edge data
      setEdges(mappedEdges.map(e => ({ ...e, data: { ...e.data, isLowData, isTeacherMode } })));

      // Auto-focus logic: Find the first locked node or the last completed node
      if (!isTeacherMode && rfInstance && mappedNodes.length > 0) {
        let activeNode;
        if (completedNodeIds.length === 0) {
          activeNode = mappedNodes.sort((a, b) => (a.data.id as number) - (b.data.id as number))[0];
        } else {
          activeNode = mappedNodes.find(n => !n.data.isCompleted && !n.data.isLocked)
            || mappedNodes.filter(n => n.data.isCompleted).pop()
            || mappedNodes[0];
        }

        if (activeNode) {
          // IMMEDIATE focus without animation to prevent flash of wrong area
          if (rfInstance) {
            rfInstance.setCenter(activeNode.position.x + 75, activeNode.position.y + 75, { zoom: 0.8, duration: 0 });
          }
        }
      }
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [isTeacherMode, subjectNodes, setNodes, setEdges, isLowData, completedNodeIds, rfInstance]);

  // Memoize translateExtent to avoid expensive recalculations during flow movement
  const translateExtent = useMemo<[[number, number], [number, number]]>(() => {
    if (!nodes || nodes.length === 0) {
      return [[-100, -Infinity], [400, Infinity]];
    }

    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      if (node.position.y < minY) minY = node.position.y;
      if (node.position.y > maxY) maxY = node.position.y;
    });

    const headerMarginY = 150;
    const bottomMarginY = 250;
    return [[-100, minY - headerMarginY], [400, maxY + bottomMarginY]] as [[number, number], [number, number]];
  }, [nodes]);



  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Inject props into nodes for CustomNode access
  const processedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onEditNode,
        onDeleteNode
      }
    }));
  }, [nodes, onEditNode, onDeleteNode]);
  const edgeTypes = useMemo(() => ({ custom: (props: EdgeProps) => <CustomEdge {...props} setEdges={setEdges} /> }), [setEdges]);

  // Xử lý sự kiện kéo nối dây (onConnect)
  const onConnect = useCallback(async (params: Connection) => {
    if (!isTeacherMode) return;

    try {
      // Lấy vị trí từ params (mặc định là bottom/top nếu kéo từ giữa node)
      const sourceHandle = params.sourceHandle || 'bottom';
      const targetHandle = params.targetHandle || 'top';

      // Gọi action update DB
      const result = await updateNodeConnection(
        params.source!,
        params.target!,
        sourceHandle,
        targetHandle
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

  // Xử lý sự kiện xóa edge
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    if (!isTeacherMode) return;

    try {
      // Xóa các edge khỏi state
      setEdges((eds) => eds.filter((edge) => !edgesToDelete.find((e) => e.id === edge.id)));

      // Gọi API để cập nhật database (nếu cần)
      edgesToDelete.forEach(async (edge) => {
        try {
          // Gọi API xóa kết nối từ database
          const response = await fetch('/api/delete-connection', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sourceId: parseInt(edge.source),
              targetId: parseInt(edge.target)
            }),
          });

          if (!response.ok) {
            console.error('Failed to delete connection from database');
          }
        } catch (error) {
          console.error('Error deleting connection:', error);
        }
      });
    } catch (error) {
      console.error('Error in onEdgesDelete:', error);
    }
  }, [isTeacherMode, setEdges]);

  // Debounce API call for performance (1 second delay)
  const debouncedUpdatePositions = useMemo(
    () =>
      debounce(async (positions: { id: string; x: number; y: number }[]) => {
        const result = await updateNodePositions(positions);
        if (!result.success) {
          console.error("Failed to update node positions:", result.error);
        }
      }, 1000),
    []
  );

  // Xử lý sự kiện thả chuột sau khi di chuyển (onNodeDragStop)
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: CustomNodeType, nodes: CustomNodeType[]) => {
    if (!isTeacherMode) return;

    try {
      // Lọc các node đang được chọn
      const selectedNodes = nodes.filter(n => n.selected === true);

      // Map thành định dạng yêu cầu
      const positions = selectedNodes.map(n => ({
        id: n.id.toString(),
        x: Math.round(n.position.x),
        y: Math.round(n.position.y)
      }));

      if (positions.length > 0) {
        // Gọi Server Action ẩn danh qua debounce để giảm tải
        debouncedUpdatePositions(positions);
      }
    } catch (error) {
      console.error("Error in onNodeDragStop:", error);
    }
  }, [isTeacherMode, debouncedUpdatePositions]);

  // Click chọn node để hiện thông tin
  const onNodeClick = useCallback((event: React.MouseEvent, node: CustomNodeType) => {
    if (onNodeSelected) {
      onNodeSelected(node.id);
    }
  }, [onNodeSelected]);

  const onLayout = useCallback(async () => {
    if (!isTeacherMode) return;

    // Calculate new layout using dagre
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );

    // Update local React Flow state
    setNodes([...layoutedNodes] as CustomNodeType[]);
    setEdges([...layoutedEdges]);

    // Save to Database
    try {
      const positionsToSave = layoutedNodes.map((n) => ({
        id: n.id.toString(),
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
      }));

      const result = await updateNodePositions(positionsToSave);
      if (!result.success) {
        console.error("Failed to save auto-layout positions:", result.error);
        alert("Lỗi khi lưu tọa độ tự động. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error saving auto-layout:", error);
    }
  }, [nodes, edges, isTeacherMode, setNodes, setEdges]);

  if (!subjectNodes) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-transparent relative overflow-hidden">
        <Loading message="Đang tải bản đồ kỹ năng..." size="lg" />
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative overflow-hidden flex flex-col ${isTeacherMode ? 'max-w-[400px] mx-auto border-x-4 border-black shadow-[4px_0_0_0_rgba(0,0,0,1),-4px_0_0_0_rgba(0,0,0,1)] bg-[#fffdf8]' : 'bg-transparent'}`}>

      {/* Cảnh vật trang trí cho Notebook */}
      {isTeacherMode && (
        <>
          {/* Lưới gáy sổ bên trái */}
          <div className="absolute left-0 top-0 bottom-0 w-8 border-r-2 border-dashed border-gray-300 z-0 pointer-events-none flex flex-col justify-around py-10 opacity-60">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-300 ml-1 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"></div>
            ))}
          </div>

          {/* Doodle hành tinh/ngôi sao */}
          <div className="absolute bottom-16 right-4 opacity-[0.15] pointer-events-none z-0 rotate-12">
            <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M10,90 Q50,10 90,90 Q50,50 10,90 Z" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="50" cy="50" r="10" fill="none" stroke="#000" strokeWidth="4" />
            </svg>
          </div>

          {/* Doodle mũi tên vẽ tay */}
          <div className="absolute top-40 right-6 opacity-20 pointer-events-none z-0 rotate-[15deg] scale-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>

          {/* Doodle chữ thập */}
          <div className="absolute bottom-40 left-12 opacity-15 pointer-events-none z-0 -rotate-12 scale-75">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>

          {/* Decal Text nhỏ chìm dưới nền dọc theo viền phải */}
          <div className="absolute top-[60%] -right-16 opacity-[0.05] pointer-events-none z-0 rotate-90 font-handwritten text-5xl tracking-[0.5em] text-black font-black whitespace-nowrap">
            SKILL TREE
          </div>

          {/* Doodle đám mây */}
          <div className="absolute top-16 left-12 opacity-[0.15] pointer-events-none z-0 -rotate-6 scale-90">
            <svg width="60" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19c2.485 0 4.5-2.015 4.5-4.5S19.985 10 17.5 10c-.394 0-.776.05-1.144.148C15.422 7.025 12.518 5 9 5c-3.866 0-7 3.134-7 7 0 .195.008.388.024.579A4.5 4.5 0 0 0 3.5 19h14z" />
            </svg>
          </div>
        </>
      )}

      {/* Global SVG Filters defined once to save rendering performance */}
      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="global-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Thanh Search Nổi */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <input
            type="text"
            placeholder="Tìm kiếm bài học..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay nhỏ để kịp click vào gợi ý
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            className={
              isTeacherMode
                ? "w-full bg-white/80 text-gray-900 placeholder-gray-500 border-2 border-black rounded-lg pl-12 pr-4 py-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] focus:outline-none focus:border-blue-600 transition-all font-bold text-lg"
                : "w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 border border-indigo-500/50 rounded-full pl-10 pr-4 py-3 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-md text-sm"
            }
          />
          <Search className={isTeacherMode ? "w-6 h-6 text-gray-600 absolute left-3" : "w-5 h-5 text-indigo-400 absolute left-3"} />
          <button type="submit" className="hidden">Search</button>
        </form>

        {/* Dropdown Gợi ý */}
        {showSuggestions && searchResults.length > 0 && (
          <div className={
            isTeacherMode
              ? "absolute mt-2 w-full bg-orange-50/95 border-2 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-h-60 overflow-y-auto z-50 font-bold"
              : "absolute mt-2 w-full bg-slate-800/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-60 overflow-y-auto z-50"
          }>
            {searchResults.map((node) => (
              <div
                key={node.id}
                onMouseDown={() => handleSelectNode(node.id)}
                className={
                  isTeacherMode
                    ? "px-4 py-3 hover:bg-yellow-200 cursor-pointer transition-colors border-b-2 border-dashed border-gray-400 last:border-0 flex items-center gap-3 text-gray-800 font-bold"
                    : "px-4 py-3 hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-700/50 last:border-0 flex items-center gap-3"
                }
              >
                <div className={
                  isTeacherMode
                    ? "w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0 bg-white"
                    : "w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0"
                }>
                  <Star size={14} className={isTeacherMode ? "text-black" : "text-indigo-400"} />
                </div>
                <div>
                  <div className={
                    isTeacherMode
                      ? "text-base font-black text-black line-clamp-1"
                      : "text-sm font-medium text-slate-200 line-clamp-1"
                  }>{node.data.title as string}</div>
                  <div className={
                    isTeacherMode
                      ? "text-xs text-gray-600 mt-0.5 capitalize font-bold"
                      : "text-xs text-slate-500 mt-0.5 capitalize"
                  }>{node.data.nodeType as string}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`flex-1 w-full h-full relative ${isTeacherMode ? 'pl-8' : ''}`}>
        <ReactFlow
          nodes={processedNodes}
          edges={edges}
          onNodesChange={onNodesChange as any}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeDragStop={onNodeDragStop as any}
          onNodeClick={onNodeClick as any}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={isTeacherMode} // ONLY fitView for teacher to see overview, students jump to active node
          onlyRenderVisibleElements={true}
          attributionPosition="bottom-right"
          connectionMode={ConnectionMode.Strict}
          connectionLineType={ConnectionLineType.Bezier}
          minZoom={0.5}
          maxZoom={1.5}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnDrag={true} // Cho phép vuốt/kéo màn hình
          panOnScroll={true} // Cho phép cuộn màn hình
          nodesDraggable={isTeacherMode} // Khóa kéo thả node với học sinh
          nodesConnectable={isTeacherMode}
          elementsSelectable={true}
          translateExtent={translateExtent}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          selectionMode={isTeacherMode ? SelectionMode.Partial : undefined}
        >
          <Background
            color={isTeacherMode ? "#94a3b8" : "#818cf8"}
            gap={isTeacherMode ? 24 : 32}
            size={isTeacherMode ? 1.5 : 1}
            variant={BackgroundVariant.Dots}
            className={isTeacherMode ? "opacity-40" : "opacity-20"}
          />

          {isTeacherMode && (
            <Panel position="bottom-center" className="flex gap-2 mb-4 w-full justify-center">
              <button
                onClick={onLayout}
                className={
                  isTeacherMode
                    ? "bg-white border-2 border-black text-black font-black py-2 px-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-yellow-100 flex items-center gap-2 transition-all text-lg"
                    : "bg-indigo-600/90 backdrop-blur hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 transition-all border border-indigo-500/50"
                }
              >
                <Star size={isTeacherMode ? 20 : 16} />
                Căn Chỉnh Tự Động
              </button>
            </Panel>
          )}

          {!isTeacherMode && (
            <Panel position="bottom-center" className="flex gap-2 mb-6 w-full justify-center z-50">
              <button
                onClick={() => {
                  if (rfInstance && nodes.length > 0) {
                    let activeNode;
                    if (completedNodeIds.length === 0) {
                      activeNode = [...nodes].sort((a, b) => (a.data.id as number) - (b.data.id as number))[0];
                    } else {
                      activeNode = nodes.find(n => !n.data.isCompleted && !n.data.isLocked)
                        || [...nodes].filter(n => n.data.isCompleted).pop()
                        || nodes[0];
                    }

                    if (activeNode) {
                      rfInstance.setCenter(activeNode.position.x + 75, activeNode.position.y + 75, { zoom: 0.8, duration: 800 });
                    }
                  }
                }}
                className="bg-white hover:bg-yellow-50 text-black border-2 border-black font-black py-3 px-6 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center gap-2 transition-all text-sm uppercase"
              >
                <Target size={20} className="text-blue-500" />
                Về Bài Hiện Tại
              </button>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

export default VisualSkillTree;
