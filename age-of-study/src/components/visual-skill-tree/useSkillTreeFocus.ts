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

      // Always use the ref to get the absolute latest value after
      // both subjectNodes and completedNodeIds have settled.
      const currentCompletedIds = completedNodeIdsRef.current;

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

      // Sort by order_index to determine curriculum order (not DB id order)
      const sortedItems = [...items].sort((a: any, b: any) => {
        const orderA = a.order_index ?? a.data?.order_index ?? getId(a);
        const orderB = b.order_index ?? b.data?.order_index ?? getId(b);
        return orderA - orderB;
      });

      // Target: first node (by curriculum order) that isn't completed yet
      // CRITICAL FIX: Skip chapter/subject nodes because they are never "completed" in DB
      const isCompletable = (n: any) => {
        const type = n.node_type || n.data?.nodeType;
        return type !== "chapter" && type !== "subject";
      };

      let activeNode = sortedItems.find(
        (n: any) => isCompletable(n) && !currentCompletedIds.includes(getId(n)),
      );

      // Fallback: all completable nodes done — focus the last completable one
      if (!activeNode && sortedItems.length > 0) {
        const completableItems = sortedItems.filter(isCompletable);
        activeNode = completableItems.length > 0 
          ? completableItems[completableItems.length - 1] 
          : sortedItems[sortedItems.length - 1];
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
    // Trigger after ReactFlow nodes are populated (not raw subjectNodes),
    // so setCenter coordinates match what ReactFlow has actually rendered.
    const hasData = nodes && nodes.length > 0;
    const canAutoFocus = Boolean(
      rfInstance && !hasAutoFocused.current && hasData,
    );

    if (canAutoFocus) {
      if (!isTeacherMode) {
        // Mark as focused immediately to prevent double-fire if the effect
        // re-runs within the delay window.
        hasAutoFocused.current = true;
        // Delay focus by 300ms so that:
        // 1. completedNodeIds ref has settled (parallel fetch with subjectNodes)
        // 2. ReactFlow has finished its internal layout cycle after onInit
        // Pass `true` so the initial jump happens instantly (duration 0)
        // rather than taking 800ms, which causes user to see top nodes first.
        const timer = setTimeout(() => applyFocus(true), 300);
        return () => clearTimeout(timer);
      }
      hasAutoFocused.current = true;
    }

    // Reset flag when subject changes (nodes go back to empty)
    if (!hasData) {
      hasAutoFocused.current = false;
    }
  }, [rfInstance, isTeacherMode, nodes, applyFocus]);

  return { applyFocus };
};
