"use client";

import { motion } from "framer-motion";

interface TestHeaderProps {
    test: any;
    totalQuestions: number;
    isStarted: boolean;
    timeWarning: boolean;
    timeLeft: number;
    formatTime: (seconds: number) => string;
}

export default function TestHeader({
    test,
    totalQuestions,
    isStarted,
    timeWarning,
    timeLeft,
    formatTime,
}: TestHeaderProps) {
    return (
        <div className="mb-10 bg-white rounded-[2rem] p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform rotate-1 relative overflow-hidden">
            <div className="absolute top-2 right-4 w-12 h-4 bg-red-200/80 border border-red-300 rounded-sm italic transform rotate-3" />
            <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tight mb-2">{test.title}</h1>
            <p className="text-slate-600 font-medium text-lg">{test.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm font-bold text-slate-700">
                <span className="bg-indigo-200 border-2 border-slate-800 px-4 py-1.5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] transform -rotate-2">
                    {test.type === "practice" ? "Luyện tập" : "Kiểm tra kỹ năng"}
                </span>
                <span className="bg-white border-2 border-slate-800 px-4 py-1.5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase">
                    {totalQuestions} Câu hỏi
                </span>
                <span className="bg-white border-2 border-slate-800 px-4 py-1.5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase">
                    {test.settings.time_limit} Phút
                </span>
                {isStarted && (
                    <motion.span
                        animate={timeWarning ? { scale: [1, 1.1, 1] } : {}}
                        transition={{
                            repeat: timeWarning ? Infinity : 0,
                            duration: 0.6,
                        }}
                        className={`border-2 border-slate-800 px-4 py-1.5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-mono text-lg ${timeWarning
                                ? "bg-red-400 text-white animate-pulse"
                                : timeLeft < 120
                                    ? "bg-orange-200 text-orange-900"
                                    : "bg-white"
                            }`}
                    >
                        {formatTime(timeLeft)}
                    </motion.span>
                )}
            </div>
        </div>
    );
}
