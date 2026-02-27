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
  isTeacherMode?: boolean; // Prop mới để biết là giáo viên
  onEditNode?: (nodeId: number) => void;
  onDeleteNode?: (nodeId: number) => void;
}

export type CustomNodeType = Node<CustomNodeData, "custom">;

interface VisualSkillTreeProps {
  gradeCode: string;
  isTeacherMode?: boolean;
  subjectNodes?: { id: number; title: string; node_type: string; parent_node_id?: number | null; position_x?: number; position_y?: number; order_index: number }[] | null;
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
      {/* Connection Points for easier linking - Hidden by default, visible on hover in teacher mode */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`w-4 h-4 rounded-full border-2 border-white transition-all duration-200 ${
          isTeacher 
            ? 'opacity-0 group-hover:opacity-100 bg-green-500 hover:bg-green-400 cursor-pointer' 
            : '!bg-transparent !border-none'
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
        className={`w-4 h-4 rounded-full border-2 border-white transition-all duration-200 ${
          isTeacher 
            ? 'opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-400 cursor-pointer' 
            : '!bg-transparent !border-none'
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
        className={`w-4 h-4 rounded-full border-2 border-white transition-all duration-200 ${
          isTeacher 
            ? 'opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-400 cursor-pointer' 
            : '!bg-transparent !border-none'
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
        className={`w-4 h-4 rounded-full border-2 border-white transition-all duration-200 ${
          isTeacher 
            ? 'opacity-0 group-hover:opacity-100 bg-purple-500 hover:bg-purple-400 cursor-pointer' 
            : '!bg-transparent !border-none'
        }`}
        style={{ 
          right: '-12px',
          top: '50%',
          transform: 'translate(50%, -50%)'
        }}
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
        {isTeacher && Number(data.id) > 0 && (
          <div className="absolute -top-4 -right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (data.onEditNode) data.onEditNode(Number(data.id));
              }}
              className="w-8 h-8 bg-blue-500 hover:bg-blue-400 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all"
              title="Chỉnh sửa"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (data.onDeleteNode) data.onDeleteNode(Number(data.id));
              }}
              className="w-8 h-8 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all"
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
      <circle r="6" fill="#fff" filter={!data?.isLowData ? `url(#glow-${id})` : "none"}>
        {!data?.isLowData && (
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            path={edgePath}
            calcMode="linear"
          />
        )}
      </circle>
      
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
  }, [nodes, rfInstance, setNodes, onNodeSelected]);

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
      const { nodes: mappedNodes, edges: mappedEdges } = transformDBNodesToFlow(subjectNodes, isTeacherMode);
      setNodes(mappedNodes);
      // Inject isLowData into edge data
      setEdges(mappedEdges.map(e => ({...e, data: { ...e.data, isLowData }})));
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [isTeacherMode, subjectNodes, setNodes, setEdges, isLowData]);

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
    <div className="w-full h-full bg-transparent relative overflow-hidden flex flex-col">
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
            className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 border border-indigo-500/50 rounded-full pl-10 pr-4 py-3 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-md text-sm"
          />
          <Search className="w-5 h-5 text-indigo-400 absolute left-3" />
          <button type="submit" className="hidden">Search</button>
        </form>

        {/* Dropdown Gợi ý */}
        {showSuggestions && searchResults.length > 0 && (
          <div className="absolute mt-2 w-full bg-slate-800/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-60 overflow-y-auto z-50">
            {searchResults.map((node) => (
              <div
                key={node.id}
                onMouseDown={() => handleSelectNode(node.id)}
                className="px-4 py-3 hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-700/50 last:border-0 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  <Star size={14} className="text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200 line-clamp-1">{node.data.title as string}</div>
                  <div className="text-xs text-slate-500 mt-0.5 capitalize">{node.data.nodeType as string}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        fitView
        attributionPosition="bottom-right"
        connectionMode={ConnectionMode.Strict}
        connectionLineType={ConnectionLineType.Bezier}
        minZoom={0.5}
        maxZoom={1.5}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnScroll={true}
        panOnScrollMode={PanOnScrollMode.Vertical}
        translateExtent={(() => {
          if (!nodes || nodes.length === 0) {
             return [[-200, -Infinity], [350, Infinity]];
          }
          
          let minY = Infinity;
          let maxY = -Infinity;
          
          nodes.forEach(node => {
            if (node.position.y < minY) minY = node.position.y;
            if (node.position.y > maxY) maxY = node.position.y;
          });
          
          // Add margins (header size + some padding)
          const marginY = 500;
          return [[-Infinity, minY - marginY], [Infinity, maxY + marginY]] as any;
        })()}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        selectionMode={isTeacherMode ? SelectionMode.Partial : undefined}
      >
        <Background
          color="#818cf8"
          gap={32}
          size={1}
          variant={BackgroundVariant.Dots}
          className="opacity-20"
        />
        
        {isTeacherMode && (
          <Panel position="bottom-center" className="flex gap-2 mb-4 w-full justify-center">
            <button
              onClick={onLayout}
              className="bg-indigo-600/90 backdrop-blur hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 transition-all border border-indigo-500/50"
            >
              <Star size={16} />
              Căn Chỉnh Tự Động
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default VisualSkillTree;
