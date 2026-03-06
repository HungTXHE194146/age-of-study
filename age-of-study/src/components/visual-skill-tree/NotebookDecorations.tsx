import React from "react";

export const NotebookDecorations = React.memo(() => (
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
));

NotebookDecorations.displayName = "NotebookDecorations";
