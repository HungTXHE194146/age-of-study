import { useState, useMemo, useCallback } from "react";
import { ReactFlowInstance } from "@xyflow/react";
import { CustomNodeType } from "./types";

export const useSkillTreeSearch = (
  nodes: CustomNodeType[],
  onNodeSelected?: (id: string | number) => void,
  rfInstance?: ReactFlowInstance | null,
  isTeacherMode?: boolean
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return nodes.filter((n) =>
      (n.data.title as string).toLowerCase().includes(query),
    );
  }, [searchQuery, nodes]);

  const handleSelectNode = useCallback(
    (
      nodeId: string,
      setNodes: React.Dispatch<React.SetStateAction<CustomNodeType[]>>,
    ) => {
      const foundNode = nodes.find((n) => n.id === nodeId);
      if (!foundNode || !rfInstance) return;

      if (!isTeacherMode && foundNode.data.isLocked) return;

      const currentZoom = rfInstance.getZoom();
      rfInstance.setCenter(
        foundNode.position.x + 75,
        foundNode.position.y + 75,
        { zoom: currentZoom, duration: 800 },
      );

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === foundNode.id,
        })),
      );

      if (onNodeSelected) onNodeSelected(foundNode.id);

      setSearchQuery(foundNode.data.title as string);
      setShowSuggestions(false);
    },
    [nodes, rfInstance, onNodeSelected, isTeacherMode],
  );

  return {
    searchQuery,
    setSearchQuery,
    showSuggestions,
    setShowSuggestions,
    searchResults,
    handleSelectNode,
  };
};
