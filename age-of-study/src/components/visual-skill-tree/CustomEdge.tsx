import React from "react";
import { EdgeProps, getBezierPath, BaseEdge, Edge } from "@xyflow/react";

export const CustomEdge = React.memo(({
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
}: EdgeProps & {
    setEdges?: (callback: (eds: Edge[]) => Edge[]) => void;
}) => {
    const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetPosition, targetX, targetY });

    const edgeColor = (data?.color as string) || "#fbbf24";
    const isTeacher = !!data?.isTeacherMode;
    const isLowData = !!data?.isLowData;

    const baseLineStyle = isTeacher
        ? { ...style, strokeWidth: 4, stroke: "#374151", strokeOpacity: 0.9, strokeDasharray: "8, 4", fill: "none" }
        : { ...style, strokeWidth: 4, stroke: "#1f2937", strokeOpacity: 0.8, strokeDasharray: "6, 6", fill: "none" };

    return (
        <>
            <svg style={{ position: "absolute", top: 0, left: 0, height: 0, width: 0 }}>
                <defs>
                    <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={baseLineStyle} />

            {!isTeacher && (
                <>
                    <BaseEdge
                        path={edgePath}
                        style={{ ...style, strokeWidth: 2, stroke: edgeColor, strokeOpacity: 0.5, fill: "none" }}
                    />
                    <circle r="6" fill="#fff" filter={!isLowData ? `url(#glow-${id})` : "none"}>
                        {!isLowData && <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} calcMode="linear" />}
                    </circle>
                </>
            )}

            {selected && setEdges && (
                <foreignObject width={24} height={24} x={(sourceX + targetX) / 2 - 12} y={(sourceY + targetY) / 2 - 12}>
                    <div
                        style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "red", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.3)", zIndex: 1000 }}
                        onClick={(e) => { e.stopPropagation(); setEdges((eds: Edge[]) => eds.filter(edge => edge.id !== id)); }}
                    >
                        <span style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>×</span>
                    </div>
                </foreignObject>
            )}
        </>
    );
});

CustomEdge.displayName = "CustomEdge";
