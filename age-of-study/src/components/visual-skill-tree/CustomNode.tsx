import React, { useContext } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Lock, FileText, Edit2, Trash2, Sparkles, Crown } from "lucide-react";
import { CustomNodeType } from "./types";
import { NodeCallbacksContext } from "./NodeCallbacksContext";
import { NODE_ICONS, TEACHER_STICKY_COLORS } from "./constants";

const HANDLE_CONFIGS = [
  {
    type: "target",
    position: Position.Top,
    id: "top",
    style: { top: "-12px", left: "50%", transform: "translate(-50%, -50%)" },
  },
  {
    type: "source",
    position: Position.Bottom,
    id: "bottom",
    style: { bottom: "-12px", left: "50%", transform: "translate(-50%, 50%)" },
  },
  {
    type: "source",
    position: Position.Left,
    id: "left",
    style: { left: "-12px", top: "50%", transform: "translate(-50%, -50%)" },
  },
  {
    type: "source",
    position: Position.Right,
    id: "right",
    style: { right: "-12px", top: "50%", transform: "translate(50%, -50%)" },
  },
] as const;

// Helpers to reduce Complex Method score
const getTeacherStyle = (
  selected: boolean,
  isLocked: boolean,
  stickyColor: string,
) => ({
  boxShadow: selected
    ? `6px 6px 0 0 rgba(0,0,0,1)`
    : `4px 4px 0 0 rgba(0,0,0,1)`,
  borderColor: "#000",
  background: isLocked ? "#e5e7eb" : stickyColor,
});

const getStudentStyle = (
  selected: boolean,
  isLocked: boolean,
  isCompleted: boolean,
  baseColor: string,
) => {
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
        className={`w-4 h-4 transition-all duration-200 ${
          isTeacher
            ? "opacity-0 group-hover:opacity-100 bg-black cursor-pointer rounded-none border-2 border-white"
            : "rounded-full border-2 border-white !bg-transparent !border-none"
        }`}
        style={config.style}
      />
    ))}
  </>
));
NodeHandles.displayName = "NodeHandles";

const TeacherEditControls = React.memo(
  ({
    id,
    selected,
    onEditNode,
    onDeleteNode,
  }: {
    id: number;
    selected: boolean;
    onEditNode?: (id: number) => void;
    onDeleteNode?: (id: number) => void;
  }) => (
    <div
      className={`absolute -top-4 -right-4 flex gap-1 transition-opacity z-50 
        ${selected ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none"}
    `}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEditNode?.(id);
        }}
        className="w-8 h-8 bg-white border-2 border-black text-black rounded-none flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
        title="Chỉnh sửa"
      >
        <Edit2 size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteNode?.(id);
        }}
        className="w-8 h-8 bg-red-100 border-2 border-black text-red-600 rounded-none flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
        title="Xóa"
      >
        <Trash2 size={14} />
      </button>
    </div>
  ),
);
TeacherEditControls.displayName = "TeacherEditControls";

// Progress Ring Component for Notebook theme
const ProgressRing = React.memo(
  ({ percentage, color }: { percentage: number; color: string }) => {
    const radius = 60;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <svg
        height={radius * 2}
        width={radius * 2}
        className="absolute -z-10 transform -rotate-90 pointer-events-none"
      >
        <circle
          stroke="#e2e8f0"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="opacity-40"
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
    );
  },
);
ProgressRing.displayName = "ProgressRing";

export const CustomNode = React.memo(
  ({ data, selected }: NodeProps<CustomNodeType>) => {
    const { onEditNode, onDeleteNode, isTeacherMode } =
      useContext(NodeCallbacksContext);
    const isTeacher = isTeacherMode;
    const isLocked = !isTeacher && !!data.isLocked;
    const isCompleted = !!data.isCompleted;

    const baseColor = isLocked ? "#9ca3af" : data.color || "#fbbf24";
    const Icon = isLocked ? Lock : NODE_ICONS[data.nodeType] || FileText;
    const progressPercentage = Math.min(
      100,
      Math.round(((data.bestXp || 0) / (data.requiredXp || 100)) * 100),
    );

    // Notebook styled styles
    const containerClass = isTeacher
      ? `relative w-36 h-36 border-2 flex flex-col items-center justify-center p-2 transition-transform duration-200 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-yellow-100 ${selected ? "scale-105 -rotate-2" : "rotate-1"}`
      : `relative w-32 h-32 flex flex-col items-center justify-center p-2 transition-all duration-300 ease-out ${
          !isLocked ? "hover:scale-110 cursor-pointer" : "cursor-not-allowed"
        } ${selected ? "scale-110 -rotate-2" : ""}`;

    const innerNodeClass = `
        w-24 h-24 rounded-full flex flex-col items-center justify-center z-10 
        border-4 border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]
        transition-all duration-300
        ${isLocked ? "bg-slate-200 border-slate-400 grayscale" : isCompleted ? "bg-[#fefce8]" : "bg-white"}
    `;

    return (
      <div className="relative group">
        <NodeHandles isTeacher={isTeacher} />

        <div
          onClick={(e) => {
            if (!isTeacher && isLocked) {
              e.stopPropagation();
            }
          }}
          className={containerClass}
        >
          {/* Progress Ring for active node (Current and slightly in-progress) */}
          {!isTeacher && !isLocked && !isCompleted && (
            <ProgressRing percentage={progressPercentage} color={baseColor} />
          )}

          {/* Teacher Tape Effect */}
          {isTeacher && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-blue-200/60 border border-blue-300 rounded-sm italic z-20 transform -rotate-1 shadow-sm" />
          )}

          {/* Main Node Body */}
          <div className={innerNodeClass}>
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform ${
                !isLocked ? "group-hover:scale-110" : ""
              }`}
              style={{ color: isLocked ? "#94a3b8" : "#0f172a" }}
            >
              <Icon size={32} strokeWidth={2.5} />
            </div>
          </div>

          {/* Label / Title below the circle */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 text-center pointer-events-none">
            <h3
              className={`text-xs font-black uppercase tracking-tight line-clamp-2 px-2 py-1 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0_0_rgba(15,23,42,1)] font-handwritten ${
                isLocked ? "text-slate-400 opacity-70" : "text-slate-800"
              }`}
            >
              {data.title}
            </h3>
          </div>

          {/* Completed Sticker (Enhanced Cartoon Style) */}
          {isCompleted && !isTeacher && (
            <div className="absolute -top-4 -right-4 z-40 animate-in zoom-in-50 duration-500 hover:scale-110 transition-transform cursor-pointer group">
              {/* Main Sticker Shape */}
              <div className="relative bg-gradient-to-br from-yellow-300 to-amber-500 text-white border-[3px] border-slate-900 rounded-2xl p-1.5 flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform rotate-12">
                {/* Glossy overlay effect */}
                <div
                  className="absolute inset-0 bg-white/20 rounded-xl pointer-events-none"
                  style={{ clipPath: "inset(0 0 60% 0)" }}
                ></div>

                <div className="flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3 h-3 text-white animate-pulse" />
                  <Crown className="w-5 h-5 text-white drop-shadow-md fill-yellow-100/30" />
                  <Sparkles className="w-3 h-3 text-white animate-pulse delay-75" />
                </div>

                <span className="text-[11px] font-[1000] italic tracking-tight uppercase leading-none text-slate-900 bg-white px-2 py-0.5 rounded-full border-2 border-slate-900 mb-0.5">
                  XONG LUN!
                </span>

                {/* Tiny dots decoration */}
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full border border-slate-900"></div>
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full border border-slate-900"></div>
              </div>
            </div>
          )}

          {/* Current Tooltip / Message */}
          {!isTeacher &&
            !isLocked &&
            !isCompleted &&
            progressPercentage < 10 && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none animate-bounce">
                <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0_0_rgba(0,0,0,1)] relative">
                  MỚI NÈ!
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black" />
                </div>
              </div>
            )}

          {/* Teacher Controls */}
          {isTeacher &&
            (Number(data.id) > 0 || String(data.id).startsWith("temp-")) && (
              <TeacherEditControls
                id={Number(data.id)}
                selected={!!selected}
                onEditNode={onEditNode}
                onDeleteNode={onDeleteNode}
              />
            )}
        </div>
      </div>
    );
  },
);

CustomNode.displayName = "CustomNode";
