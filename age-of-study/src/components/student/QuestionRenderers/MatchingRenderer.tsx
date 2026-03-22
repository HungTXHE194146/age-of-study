"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question } from "@/types/teacher";

interface MatchingRendererProps {
    matchingPairs: Array<{ left: string; right: string }>;
    onComplete: (isCorrect: boolean, pairs: any[]) => void;
    onUpdate?: (pairs: any[]) => void;
    initialAnswer?: any[];
    supportMode?: boolean;
    hint?: string;
    showHintsSetting?: boolean;
}

export default function MatchingRenderer({
    matchingPairs,
    onComplete,
    onUpdate,
    initialAnswer,
    supportMode = true,
    hint,
    showHintsSetting = false,
}: MatchingRendererProps) {
    const [leftItems, setLeftItems] = useState<string[]>([]);
    const [rightItems, setRightItems] = useState<string[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [selectedRight, setSelectedRight] = useState<string | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<Array<{ left: string; right: string }>>([]);
    const [isWobbling, setIsWobbling] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        setLeftItems([...matchingPairs.map(p => p.left)].sort(() => Math.random() - 0.5));
        setRightItems([...matchingPairs.map(p => p.right)].sort(() => Math.random() - 0.5));

        if (initialAnswer && initialAnswer.length > 0) {
            setMatchedPairs(initialAnswer);
        } else {
            setMatchedPairs([]);
        }

        setSelectedLeft(null);
        setSelectedRight(null);
        setShowHint(false);
    }, [matchingPairs, initialAnswer]);

    const handleLeftClick = (item: string) => {
        if (matchedPairs.some((p: { left: string }) => p.left === item)) return;
        setSelectedLeft(item === selectedLeft ? null : item);
        checkMatch(item, selectedRight);
    };

    const handleRightClick = (item: string) => {
        if (matchedPairs.some((p: { right: string }) => p.right === item)) return;
        setSelectedRight(item === selectedRight ? null : item);
        checkMatch(selectedLeft, item);
    };

    const checkMatch = (left: string | null, right: string | null) => {
        if (left && right) {
            const isCorrectMatch = matchingPairs.some(p => p.left === left && p.right === right);

            if (isCorrectMatch) {
                const newMatched = [...matchedPairs, { left, right }];
                setMatchedPairs(newMatched);
                setSelectedLeft(null);
                setSelectedRight(null);

                // Sync to parent
                onUpdate?.(newMatched);

                if (newMatched.length === matchingPairs.length) {
                    onComplete(true, newMatched);
                }
            } else {
                setIsWobbling(true);
                setTimeout(() => {
                    setIsWobbling(false);
                    setSelectedLeft(null);
                    setSelectedRight(null);
                }, 500);
                if (supportMode) setShowHint(true);
            }
        }
    };

    return (
        <div className="space-y-8 p-4">
            <div className="grid grid-cols-2 gap-12">
                {/* Cột trái */}
                <div className="space-y-4">
                    {leftItems.map((item, idx) => {
                        const isMatched = matchedPairs.some(p => p.left === item);
                        return (
                            <motion.button
                                key={`left-${idx}`}
                                disabled={isMatched}
                                onClick={() => handleLeftClick(item)}
                                animate={isWobbling && selectedLeft === item ? { x: [-5, 5, -5, 5, 0] } : {}}
                                className={`w-full p-6 text-xl font-black rounded-2xl border-4 transition-all shadow-[6px_6px_0_0_rgba(0,0,0,1)]
                  ${isMatched ? "bg-green-100 border-green-500 text-green-700 opacity-50" :
                                        selectedLeft === item ? "bg-indigo-500 border-slate-800 text-white translate-y-1 shadow-none" :
                                            "bg-white border-slate-800 text-slate-800 hover:bg-slate-50"}`}
                            >
                                {item}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Cột phải */}
                <div className="space-y-4">
                    {rightItems.map((item, idx) => {
                        const isMatched = matchedPairs.some(p => p.right === item);
                        return (
                            <motion.button
                                key={`right-${idx}`}
                                disabled={isMatched}
                                onClick={() => handleRightClick(item)}
                                animate={isWobbling && selectedRight === item ? { x: [-5, 5, -5, 5, 0] } : {}}
                                className={`w-full p-6 text-xl font-black rounded-2xl border-4 transition-all shadow-[6px_6px_0_0_rgba(0,0,0,1)]
                  ${isMatched ? "bg-green-100 border-green-500 text-green-700 opacity-50" :
                                        selectedRight === item ? "bg-indigo-500 border-slate-800 text-white translate-y-1 shadow-none" :
                                            "bg-white border-slate-800 text-slate-800 hover:bg-slate-50"}`}
                            >
                                {item}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {showHint && matchedPairs.length < matchingPairs.length && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-sky-100 p-6 rounded-[2rem] border-4 border-sky-400 shadow-[4px_4px_0_0_rgba(56,189,248,1)] flex items-center gap-4"
                    >
                        <div className="text-4xl">🦉</div>
                        <p className="font-black text-sky-800 italic">
                            {showHintsSetting && hint
                                ? hint
                                : '"Bạn nhỏ ơi, hãy nối hết các cặp để khám phá bí mật tiếp theo nào!"'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
