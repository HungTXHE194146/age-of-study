"use client";

import React, { useMemo, useEffect, useCallback, useState } from "react";
import { debounce } from "lodash";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Edge,
  ConnectionMode,
  ConnectionLineType,
  BackgroundVariant,
  Connection,
  addEdge,
  SelectionMode,
  ReactFlowInstance,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Search, Star, Target } from "lucide-react";
import { transformDBNodesToFlow } from "@/utils/skillTreeMapper";
import { updateNodeConnection, updateNodePositions } from "@/actions/skillTreeActions";
import { getLayoutedElements } from "@/utils/layoutUtils";
import Loading from "@/components/ui/loading";

// Import extracted components and logic
import { useSkillTreeSearch } from "./visual-skill-tree/useSkillTreeSearch";
import { useSkillTreeFocus } from "./visual-skill-tree/useSkillTreeFocus";
import { NotebookDecorations } from "./visual-skill-tree/NotebookDecorations";
import { CustomNode } from "./visual-skill-tree/CustomNode";
import { CustomEdge } from "./visual-skill-tree/CustomEdge";
import { NodeCallbacksContext } from "./visual-skill-tree/NodeCallbacksContext";
import { VisualSkillTreeProps, CustomNodeType } from "./visual-skill-tree/types";
import { EMPTY_NODE_IDS } from "./visual-skill-tree/constants";

const VisualSkillTree: React.FC<VisualSkillTreeProps> = ({
  gradeCode,
  isTeacherMode = false,
  subjectNodes,
  completedNodeIds = EMPTY_NODE_IDS,
  onNodeSelected,
  onEditNode,
  onDeleteNode,
}) => {
  // Create refs for values used in focus logic to avoid dependency loop re-renders
  const completedNodeIdsRef = React.useRef(completedNodeIds);
  useEffect(() => {
    completedNodeIdsRef.current = completedNodeIds;
  }, [completedNodeIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isLowData, setIsLowData] = useState(false);

  // MUST BE CALLED TOP LEVEL TO AVOID REACT HOOK ORDER VIOLATION
  const contextValue = useMemo(
    () => ({ onEditNode, onDeleteNode, isTeacherMode }),
    [onEditNode, onDeleteNode, isTeacherMode],
  );

  // Search logic
  const {
    searchQuery,
    setSearchQuery,
    showSuggestions,
    setShowSuggestions,
    searchResults,
    handleSelectNode,
  } = useSkillTreeSearch(nodes, onNodeSelected, rfInstance, isTeacherMode);

  // Low data mode listener
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        setIsLowData(localStorage.getItem("low_data_mode_enabled") === "true");
      }
    };
    handleStorageChange();
    window.addEventListener("lowDataModeChanged", handleStorageChange);
    return () => window.removeEventListener("lowDataModeChanged", handleStorageChange);
  }, []);

  // Form submit for search
  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectNode(searchResults[0].id.toString(), setNodes as any);
    } else if (searchQuery.trim()) {
      alert("Không tìm thấy bài học phù hợp!");
    }
  };

  // Memoized nodes and edges data from DB nodes
  const mappedData = useMemo(() => {
    if (!subjectNodes) return null;
    return transformDBNodesToFlow(
      subjectNodes,
      isTeacherMode || false,
      completedNodeIds,
    );
  }, [subjectNodes, isTeacherMode, completedNodeIds]);

  // Sync flows to local state
  useEffect(() => {
    if (mappedData) {
      setNodes(mappedData.nodes);
      // Inject isLowData and isTeacherMode into edge data
      setEdges(
        mappedData.edges.map((e) => ({
          ...e,
          data: { ...e.data, isLowData, isTeacherMode },
        })),
      );
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [mappedData, setNodes, setEdges, isLowData, isTeacherMode]);

  // Focus logic
  const { applyFocus } = useSkillTreeFocus(
    rfInstance,
    subjectNodes,
    nodes,
    completedNodeIds,
    isTeacherMode
  );

  // Translate extent for zooming boundaries
  const calculatedTranslateExtent = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return [[-1000, -Infinity], [1000, Infinity]] as any;
    }

    let minY = Infinity;
    let maxY = -Infinity;
    let minX = Infinity;
    let maxX = -Infinity;

    for (const node of nodes) {
      const x = node.position.x;
      const y = node.position.y;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }

    const centerX = (minX + maxX) / 2 + 75; // 75 is half node width
    const horizontalRange = 1;
    const headerMarginY = 150;
    const bottomMarginY = 250;

    return [
      [centerX - horizontalRange, minY - headerMarginY],
      [centerX + horizontalRange, maxY + bottomMarginY],
    ] as any;
  }, [nodes]);

  // Provide node & edge types
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(
    () => ({
      custom: (props: any) => <CustomEdge {...props} setEdges={setEdges} />,
    }),
    [setEdges]
  );

  // Connect edges
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!isTeacherMode) return;
      try {
        const sourceHandle = params.sourceHandle || "bottom";
        const targetHandle = params.targetHandle || "top";

        if (!params.source || !params.target) {
          console.error("Invalid connection: missing source or target");
          return;
        }

        const result = await updateNodeConnection(
          params.source,
          params.target,
          sourceHandle,
          targetHandle
        );

        if (!result.success) {
          console.error("Failed to update node connection:", result.error);
          return;
        }

        setEdges((eds) => addEdge(params, eds));
      } catch (error) {
        console.error("Error in onConnect:", error);
      }
    },
    [isTeacherMode, setEdges]
  );

  // Delete edges
  const onEdgesDelete = useCallback(
    async (edgesToDelete: Edge[]) => {
      if (!isTeacherMode || !edgesToDelete.length) return;

      let previousEdges: Edge[] = [];
      setEdges((eds) => {
        previousEdges = eds;
        return eds.filter((edge) => !edgesToDelete.find((e) => e.id === edge.id));
      });

      try {
        const deletePromises = edgesToDelete.map(async (edge) => {
          const response = await fetch("/api/delete-connection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId: parseInt(edge.source),
              targetId: parseInt(edge.target),
            }),
          });
          if (!response.ok) throw new Error(`Failed to delete connection ${edge.id}`);
          return response;
        });

        await Promise.all(deletePromises);
      } catch (error) {
        console.error("Error deleting connection, rolling back:", error);
        setEdges(previousEdges);
        alert("Lỗi khi xóa kết nối. Vui lòng thử lại.");
      }
    },
    [isTeacherMode, setEdges]
  );

  // Drag logic
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

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: CustomNodeType, nodesArg: CustomNodeType[]) => {
      if (!isTeacherMode) return;

      const selectedNodes = nodesArg.filter((n) => n.selected === true);
      if (selectedNodes.length === 0) return;

      const positions = selectedNodes.map((n) => ({
        id: n.id.toString(),
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
      }));

      debouncedUpdatePositions(positions);
    },
    [isTeacherMode, debouncedUpdatePositions]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: CustomNodeType) => {
      if (onNodeSelected) {
        onNodeSelected(node.id);
      }
    },
    [onNodeSelected]
  );

  const onLayout = useCallback(async () => {
    if (!isTeacherMode) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);

    setNodes([...layoutedNodes] as CustomNodeType[]);
    setEdges([...layoutedEdges]);

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
    <NodeCallbacksContext.Provider value={contextValue}>
      <div
        className={`w-full h-full relative overflow-hidden flex flex-col ${isTeacherMode ? "max-w-[400px] mx-auto border-x-4 border-black shadow-[4px_0_0_0_rgba(0,0,0,1),-4px_0_0_0_rgba(0,0,0,1)] bg-[#fffdf8]" : "bg-transparent"}`}
      >
        {/* Shared SVG filter – rendered once to avoid duplicate DOM nodes per edge */}
        <svg
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            overflow: "hidden",
          }}
        >
          <defs>
            <filter
              id="glow-shared"
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
        {/* Cảnh vật trang trí cho Notebook */}
        {isTeacherMode && (
          <>
            {/* Lưới gáy sổ bên trái */}
            <div className="absolute left-0 top-0 bottom-0 w-8 border-r-2 border-dashed border-gray-300 z-0 pointer-events-none flex flex-col justify-around py-10 opacity-60">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-300 ml-1 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
                ></div>
              ))}
            </div>

            {/* Doodle hành tinh/ngôi sao */}
            <div className="absolute bottom-16 right-4 opacity-[0.15] pointer-events-none z-0 rotate-12">
              <svg
                width="60"
                height="60"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10,90 Q50,10 90,90 Q50,50 10,90 Z"
                  fill="none"
                  stroke="#000"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="10"
                  fill="none"
                  stroke="#000"
                  strokeWidth="4"
                />
              </svg>
            </div>

            {/* Doodle mũi tên vẽ tay */}
            <div className="absolute top-40 right-6 opacity-20 pointer-events-none z-0 rotate-[15deg] scale-100">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>

            {/* Doodle chữ thập */}
            <div className="absolute bottom-40 left-12 opacity-15 pointer-events-none z-0 -rotate-12 scale-75">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              <svg
                width="60"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.5 19c2.485 0 4.5-2.015 4.5-4.5S19.985 10 17.5 10c-.394 0-.776.05-1.144.148C15.422 7.025 12.518 5 9 5c-3.866 0-7 3.134-7 7 0 .195.008.388.024.579A4.5 4.5 0 0 0 3.5 19h14z" />
              </svg>
            </div>
          </>
        )}

        {/* Thanh Search Nổi */}
        <div className="absolute top-4 left-4 right-4 z-50">
          <form onSubmit={handleSearchFormSubmit} className="relative flex items-center">
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
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className={
                isTeacherMode
                  ? "w-full bg-white/80 text-gray-900 placeholder-gray-500 border-2 border-black rounded-lg pl-12 pr-4 py-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] focus:outline-none focus:border-blue-600 transition-all font-bold text-lg"
                  : "w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 border border-indigo-500/50 rounded-full pl-10 pr-4 py-3 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-md text-sm"
              }
            />
            <Search
              className={
                isTeacherMode
                  ? "w-6 h-6 text-gray-600 absolute left-3"
                  : "w-5 h-5 text-indigo-400 absolute left-3"
              }
            />
            <button type="submit" className="hidden">
              Search
            </button>
          </form>

          {showSuggestions && searchResults.length > 0 && (
            <div
              className={
                isTeacherMode
                  ? "absolute mt-2 w-full bg-orange-50/95 border-2 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-h-60 overflow-y-auto z-50 font-bold"
                  : "absolute mt-2 w-full bg-slate-800/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-60 overflow-y-auto z-50"
              }
            >
              {searchResults.map((node) => (
                <div
                  key={node.id}
                  onMouseDown={() => handleSelectNode(node.id.toString(), setNodes as any)}
                  className={
                    isTeacherMode
                      ? "px-4 py-3 hover:bg-yellow-200 cursor-pointer transition-colors border-b-2 border-dashed border-gray-400 last:border-0 flex items-center gap-3 text-gray-800 font-bold"
                      : "px-4 py-3 hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-700/50 last:border-0 flex items-center gap-3"
                  }
                >
                  <div
                    className={
                      isTeacherMode
                        ? "w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0 bg-white"
                        : "w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0"
                    }
                  >
                    <Star
                      size={14}
                      className={
                        isTeacherMode ? "text-black" : "text-indigo-400"
                      }
                    />
                  </div>
                  <div>
                    <div
                      className={
                        isTeacherMode
                          ? "text-base font-black text-black line-clamp-1"
                          : "text-sm font-medium text-slate-200 line-clamp-1"
                      }
                    >
                      {node.data.title as string}
                    </div>
                    <div
                      className={
                        isTeacherMode
                          ? "text-xs text-gray-600 mt-0.5 capitalize font-bold"
                          : "text-xs text-slate-500 mt-0.5 capitalize"
                      }
                    >
                      {node.data.nodeType as string}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={`flex-1 w-full h-full relative ${isTeacherMode ? "pl-8" : ""}`}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange as any}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onNodeDragStop={onNodeDragStop as any}
            onNodeClick={onNodeClick as any}
            onInit={setRfInstance}
            nodeTypes={nodeTypes as any}
            edgeTypes={edgeTypes as any}
            fitView
            attributionPosition="bottom-right"
            connectionMode={ConnectionMode.Strict}
            connectionLineType={ConnectionLineType.Bezier}
            minZoom={0.5}
            maxZoom={1.5}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            panOnDrag={true}
            panOnScroll={true}
            nodesDraggable={isTeacherMode}
            nodesConnectable={isTeacherMode}
            elementsSelectable={true}
            translateExtent={(() => {
              if (!nodes || nodes.length === 0) {
                return [
                  [-1000, -Infinity],
                  [1000, Infinity],
                ];
              }

              let minY = Infinity;
              let maxY = -Infinity;
              let minX = Infinity;
              let maxX = -Infinity;

              nodes.forEach((node) => {
                const x = node.position.x;
                const y = node.position.y;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
              });

              const centerX = (minX + maxX) / 2 + 75; // 75 is half node width

              // For students, we want to lock horizontal scroll.
              // To prevent the 'snapping' issue, the X range should be centered around the nodes.
              // We use a safe margin that prevents significant horizontal movement but avoids snapping.
              const horizontalRange = 1;

              const headerMarginY = 150;
              const bottomMarginY = 250;

              return [
                [centerX - horizontalRange, minY - headerMarginY],
                [centerX + horizontalRange, maxY + bottomMarginY],
              ] as any;
            })()}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            selectionMode={isTeacherMode ? SelectionMode.Partial : undefined}
            onlyRenderVisibleElements={true}
          >
            <Background
              color={isTeacherMode ? "#94a3b8" : "#818cf8"}
              gap={isTeacherMode ? 24 : 32}
              size={isTeacherMode ? 1.5 : 1}
              variant={BackgroundVariant.Dots}
              className={isTeacherMode ? "opacity-40" : "opacity-20"}
            />

            {isTeacherMode && (
              <Panel
                position="bottom-center"
                className="flex gap-2 mb-4 w-full justify-center"
              >
                <button
                  onClick={onLayout}
                  className="bg-white border-2 border-black text-black font-black py-2 px-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-yellow-100 flex items-center gap-2 transition-all text-lg"
                >
                  <Star size={20} />
                  Căn Chỉnh Tự Động
                </button>
              </Panel>
            )}
          </ReactFlow>

            {!isTeacherMode && (
              <Panel
                position="bottom-center"
                className="flex gap-2 mb-6 w-full justify-center z-50"
              >
                <button
                  onClick={() => {
                    if (rfInstance && nodes.length > 0) {
                      let activeNode;
                      if (completedNodeIds.length === 0) {
                        activeNode = [...nodes].sort(
                          (a, b) =>
                            (a.data.id as number) - (b.data.id as number),
                        )[0];
                      } else {
                        // Logic: Lấy node ID đã hoàn thành cao nhất + 1
                        const maxCompletedId = Math.max(...completedNodeIds);
                        const nextNodeId = maxCompletedId + 1;
                        activeNode =
                          nodes.find(
                            (n) => (n.data.id as number) === nextNodeId,
                          ) ||
                          nodes.find(
                            (n) => (n.data.id as number) === maxCompletedId,
                          ) ||
                          nodes[0];
                      }

                      if (activeNode) {
                        // Tính toán centerX động để đảm bảo viewport không bị lệch khi bấm nút
                        let minX = Infinity;
                        let maxX = -Infinity;
                        nodes.forEach((n) => {
                          if (n.position.x < minX) minX = n.position.x;
                          if (n.position.x > maxX) maxX = n.position.x;
                        });
                        const centerX = (minX + maxX) / 2 + 75;

                        rfInstance.setCenter(
                          centerX,
                          activeNode.position.y + 75,
                          { zoom: 0.8, duration: 800 },
                        );
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
    </NodeCallbacksContext.Provider>
  );
};

export default VisualSkillTree;
