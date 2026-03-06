import React, { useContext } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Lock, FileText, Edit2, Trash2 } from "lucide-react";
import { CustomNodeType } from "./types";
import { NodeCallbacksContext } from "./NodeCallbacksContext";
import { NODE_ICONS, TEACHER_STICKY_COLORS } from "./constants";

const HANDLE_CONFIGS = [
    { type: "target", position: Position.Top, id: "top", style: { top: "-12px", left: "50%", transform: "translate(-50%, -50%)" } },
    { type: "source", position: Position.Bottom, id: "bottom", style: { bottom: "-12px", left: "50%", transform: "translate(-50%, 50%)" } },
    { type: "source", position: Position.Left, id: "left", style: { left: "-12px", top: "50%", transform: "translate(-50%, -50%)" } },
    { type: "source", position: Position.Right, id: "right", style: { right: "-12px", top: "50%", transform: "translate(50%, -50%)" } },
] as const;

// Helpers to reduce Complex Method score
const getTeacherStyle = (selected: boolean, isLocked: boolean, stickyColor: string) => ({
    boxShadow: selected ? `6px 6px 0 0 rgba(0,0,0,1)` : `4px 4px 0 0 rgba(0,0,0,1)`,
    borderColor: "#000",
    background: isLocked ? "#e5e7eb" : stickyColor,
});

const getStudentStyle = (selected: boolean, isLocked: boolean, isCompleted: boolean, baseColor: string) => {
    const bgColor = isLocked
        ? "linear-gradient(145deg, #e5e7eb, #9ca3af)"
        : isCompleted
            ? `linear-gradient(145deg, #f0fdf4, #dcfce7)`
            : `linear-gradient(145deg, #ffffff, ${baseColor}20)`;

    const borderColor = isCompleted ? "#22c55e" : baseColor;

    const shadow = selected
        ? `0 0 20px 5px ${isCompleted ? "#22c55e" : baseColor}, 0 10px 15px -3px rgba(0,0,0,0.3)`
        : `0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px ${isCompleted ? "#22c55e" : baseColor}80`;

    return { boxShadow: shadow, borderColor, background: bgColor };
};

const NodeHandles = React.memo(({ isTeacher }: { isTeacher: boolean }) => (
    <>
        {HANDLE_CONFIGS.map((config) => (
            <Handle
                key={config.id}
                type={config.type as any}
                position={config.position}
                id={config.id}
                className={`w-4 h-4 transition-all duration-200 ${isTeacher
                        ? "opacity-0 group-hover:opacity-100 bg-black cursor-pointer rounded-none border-2 border-white"
                        : "rounded-full border-2 border-white !bg-transparent !border-none"
                    }`}
                style={config.style}
            />
        ))}
    </>
));
NodeHandles.displayName = "NodeHandles";

const TeacherEditControls = React.memo(({
    id,
    onEditNode,
    onDeleteNode
}: {
    id: number;
    onEditNode?: (id: number) => void;
    onDeleteNode?: (id: number) => void;
}) => (
    <div className="absolute -top-4 -right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <button
            onClick={(e) => { e.stopPropagation(); onEditNode?.(id); }}
            className="w-8 h-8 bg-white border-2 border-black text-black rounded-none flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
            title="Chỉnh sửa"
        >
            <Edit2 size={14} />
        </button>
        <button
            onClick={(e) => { e.stopPropagation(); onDeleteNode?.(id); }}
            className="w-8 h-8 bg-red-100 border-2 border-black text-red-600 rounded-none flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
            title="Xóa"
        >
            <Trash2 size={14} />
        </button>
    </div>
));
TeacherEditControls.displayName = "TeacherEditControls";

export const CustomNode = React.memo(({ data, selected }: NodeProps<CustomNodeType>) => {
    const { onEditNode, onDeleteNode, isTeacherMode } = useContext(NodeCallbacksContext);
    const isTeacher = isTeacherMode;
    const isLocked = !isTeacher && !!data.isLocked;
    const isCompleted = !!data.isCompleted;

    const baseColor = isLocked ? "#9ca3af" : data.color || "#fbbf24";
    const Icon = isLocked ? Lock : (NODE_ICONS[data.nodeType] || FileText);
    const teacherStickyColor = TEACHER_STICKY_COLORS[data.nodeType] || "#fef08a";

    const nodeStyle = isTeacher
        ? getTeacherStyle(selected, isLocked, teacherStickyColor)
        : getStudentStyle(selected, isLocked, isCompleted, baseColor);

    const containerClass = isTeacher
        ? `relative w-36 h-36 border-2 flex flex-col items-center justify-center p-2 transition-transform duration-200 ${!isLocked ? "hover:-translate-y-1" : ""
        } ${selected ? "scale-105 -rotate-2" : "rotate-1"}`
        : `relative w-32 h-32 rounded-[2rem] border-[3px] border-slate-800 flex flex-col items-center justify-center p-2 transition-all duration-300 ease-out notebook-lines ${!isLocked ? "hover:scale-105 hover:-translate-y-1 cursor-pointer" : "opacity-80 cursor-not-allowed"
        } ${selected ? "scale-105 -rotate-2 ring-4 ring-offset-2 ring-blue-500" : "rotate-1"}`;

    const iconContainerClass = isTeacher
        ? `w-12 h-12 flex items-center justify-center mb-1 z-10 ${isLocked ? "text-gray-400" : "text-gray-900"}`
        : `w-14 h-14 rounded-full flex items-center justify-center mb-2 border-2 border-slate-800 z-10 ${isLocked ? "bg-gray-200 opacity-60" : isCompleted ? "bg-green-300" : "bg-white"
        }`;

    const titleClass = isTeacher
        ? `text-sm font-bold leading-tight line-clamp-3 text-black font-handwritten tracking-wide`
        : `text-xs font-black leading-tight line-clamp-2 uppercase tracking-wide px-1 ${isLocked ? "text-slate-500" : "text-slate-900"
        }`;

    return (
        <div className="relative group">
            <NodeHandles isTeacher={isTeacher} />

            <div
                style={nodeStyle}
                onClick={(e) => {
                    if (!isTeacher && isLocked) e.stopPropagation();
                }}
                className={containerClass}
            >
                {isTeacher && !isLocked && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-red-200/60 border border-red-300 rounded-sm italic z-0 transform -rotate-2" />
                )}

                <div
                    className={iconContainerClass}
                    style={{
                        color: isTeacher ? undefined : isLocked ? "#64748b" : "#0f172a",
                        boxShadow: isTeacher ? "none" : "2px 2px 0 0 rgba(0,0,0,1)",
                    }}
                >
                    <Icon
                        size={isTeacher ? 36 : 28}
                        strokeWidth={isTeacher ? 2 : 2.5}
                        className={`${!isLocked && !isTeacher ? "group-hover:animate-wiggle" : ""}`}
                    />
                </div>

                <div className="text-center px-1 z-10 w-full">
                    <h3 className={titleClass} style={{ textShadow: isTeacher ? "none" : "1px 1px 0 #fff" }}>
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

                {isTeacher && Number(data.id) > 0 && (
                    <TeacherEditControls
                        id={Number(data.id)}
                        onEditNode={onEditNode}
                        onDeleteNode={onDeleteNode}
                    />
                )}
            </div>
        </div>
    );
});

CustomNode.displayName = "CustomNode";
