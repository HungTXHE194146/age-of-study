"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question } from "@/types/teacher";

interface FillInBlanksRendererProps {
    questionText: string;
    blanks: Array<{ index: number; answer: string }>;
    onComplete: (isCorrect: boolean, answers: string[]) => void;
    onUpdate?: (answers: string[]) => void;
    initialAnswer?: string[];
    supportMode?: boolean;
    hint?: string;
    showHintsSetting?: boolean;
}

export default function FillInBlanksRenderer({
    questionText,
    blanks,
    onComplete,
    onUpdate,
    initialAnswer,
    supportMode = true,
    hint,
    showHintsSetting = false,
}: FillInBlanksRendererProps) {
    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(blanks.length).fill(""));
    const [isWobbling, setIsWobbling] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        if (initialAnswer && initialAnswer.length === blanks.length) {
            setUserAnswers(initialAnswer);
        } else {
            setUserAnswers(new Array(blanks.length).fill(""));
        }
        setShowHint(false);
    }, [blanks, initialAnswer]);

    // Bỏ debounce tự động, chỉ kiểm tra khi nhấn Enter theo yêu cầu người dùng

    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);
        onUpdate?.(newAnswers);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (userAnswers.every((ans: string) => ans.trim() !== "")) {
                const isAllCorrect = userAnswers.every((ans: string, i: number) =>
                    blanks[i] && ans.trim().toLowerCase() === blanks[i].answer.trim().toLowerCase()
                );

                onComplete(isAllCorrect, userAnswers);

                if (!isAllCorrect) {
                    setIsWobbling(true);
                    setTimeout(() => setIsWobbling(false), 500);
                    if (supportMode) setShowHint(true);
                }
            } else {
                // Nếu chưa điền hết mà nhấn Enter thì rung nhẹ để nhắc nhở
                setIsWobbling(true);
                setTimeout(() => setIsWobbling(false), 500);
            }
        }
    };

    // Tách văn bản thành các đoạn để chèn input (nhận diện 3 gạch trở lên)
    const segments = questionText.split(/_{3,}/);

    return (
        <div className="space-y-6">
            <motion.div
                animate={isWobbling ? { x: [-5, 5, -5, 5, 0] } : {}}
                className="p-10 bg-white border-4 border-black rounded-[3rem] shadow-[12px_12px_0_0_rgba(0,0,0,1)] leading-[2.5] text-2xl font-bold text-slate-800"
            >
                {segments.map((segment, index) => (
                    <span key={index}>
                        {segment}
                        {index < segments.length - 1 && index < blanks.length && (
                            <input
                                type="text"
                                value={userAnswers[index] || ""}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="..."
                                className="mx-2 px-4 py-0 w-48 text-center bg-blue-50 border-b-4 border-blue-500 text-blue-700 focus:outline-none focus:bg-amber-50 focus:border-amber-500 transition-all rounded-t-lg"
                                autoFocus={index === 0}
                            />
                        )}
                    </span>
                ))}
            </motion.div>


            <AnimatePresence>
                {showHint && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 bg-orange-100 p-6 rounded-3xl border-4 border-orange-400 text-orange-900"
                    >
                        <div className="text-4xl text-orange-500">🦉</div>
                        <p className="font-black italic text-lg">
                            {showHintsSetting && hint
                                ? hint
                                : "Ôi, hiệp sĩ ơi! Còn một chút xíu nữa thôi, mình hoàn thành nốt nhé!"}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center text-slate-400 font-bold italic">
                (Nhấn phím Enter sau khi điền xong để kiểm tra nhé!)
            </p>
        </div>
    );
}
