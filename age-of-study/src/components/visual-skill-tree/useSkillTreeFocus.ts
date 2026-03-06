import { useCallback, useRef, useEffect } from "react";
import { ReactFlowInstance } from "@xyflow/react";
import { CustomNodeType } from "./types";

export const useSkillTreeFocus = (
  rfInstance: ReactFlowInstance | null,
  subjectNodes: any[] | null | undefined,
  nodes: CustomNodeType[],
  completedNodeIds: number[],
  isTeacherMode: boolean,
) => {
  const hasAutoFocused = useRef(false);
  const completedNodeIdsRef = useRef(completedNodeIds);

  useEffect(() => {
    completedNodeIdsRef.current = completedNodeIds;
  }, [completedNodeIds]);

  const applyFocus = useCallback(
    (isInitial: boolean) => {
      if (!rfInstance) return;

      const items = isInitial ? subjectNodes : nodes;
      if (!items || items.length === 0) return;

      const currentCompletedIds = isInitial
        ? completedNodeIdsRef.current || []
        : completedNodeIds;
      const maxCompletedId =
        currentCompletedIds.length > 0
          ? Math.max(...currentCompletedIds)
          : null;
      const nextNodeId = maxCompletedId !== null ? maxCompletedId + 1 : null;

      const getId = (n: any) =>
        typeof n.id === "number" ? n.id : Number(n.data?.id);
      const getX = (n: any) =>
        typeof n.position_x === "number"
          ? n.position_x
          : n.position?.x ?? 0;
      const getY = (n: any) =>
        typeof n.position_y === "number"
          ? n.position_y
          : n.position?.y ?? 0;

      // Extract node finding logic into distinct steps to avoid complex conditional expressions
      let activeNode = nextNodeId
        ? items.find((n: any) => getId(n) === nextNodeId)
        : undefined;

      if (!activeNode && maxCompletedId) {
        activeNode = items.find((n: any) => getId(n) === maxCompletedId);
      }

      if (!activeNode) {
        const sortedItems = [...items].sort(
          (a: any, b: any) => getId(a) - getId(b),
        );
        activeNode = sortedItems[0];
      }

      if (activeNode) {
        let minX = Infinity;
        let maxX = -Infinity;
        for (const n of items) {
          const x = getX(n);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
        const centerX = (minX + maxX) / 2 + 75;
        rfInstance.setCenter(centerX, getY(activeNode) + 75, {
          zoom: 0.8,
          duration: isInitial ? 0 : 800,
        });
      }
    },
    [rfInstance, subjectNodes, nodes, completedNodeIds],
  );

  useEffect(() => {
    const hasData = subjectNodes && subjectNodes.length > 0;
    const canAutoFocus = Boolean(
      rfInstance && !hasAutoFocused.current && hasData,
    );

    if (canAutoFocus) {
      if (!isTeacherMode) applyFocus(true);
      hasAutoFocused.current = true;
    }

    if (!hasData) {
      hasAutoFocused.current = false;
    }
  }, [rfInstance, isTeacherMode, subjectNodes, applyFocus]);

  return { applyFocus };
};
