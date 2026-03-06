import { Node } from "@xyflow/react";

export interface NodeCallbacksContextType {
  onEditNode?: (nodeId: number) => void;
  onDeleteNode?: (nodeId: number) => void;
  isTeacherMode: boolean;
}

export interface CustomNodeData extends Record<string, unknown> {
  id: number | string;
  title: string;
  nodeType: string;
  color: string;
  isLocked: boolean;
  isCompleted?: boolean;
}

export type CustomNodeType = Node<CustomNodeData, "custom">;

export interface VisualSkillTreeProps {
  gradeCode: string;
  isTeacherMode?: boolean;
  subjectNodes?:
    | {
        id: number;
        title: string;
        node_type: string;
        parent_node_id?: number | null;
        position_x?: number;
        position_y?: number;
        order_index: number;
      }[]
    | null;
  completedNodeIds?: number[];
  onNodeSelected?: (id: string | number) => void;
  onEditNode?: (nodeId: number) => void;
  onDeleteNode?: (nodeId: number) => void;
}
