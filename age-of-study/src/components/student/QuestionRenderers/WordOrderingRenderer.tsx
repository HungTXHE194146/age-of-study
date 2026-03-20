"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question } from "@/types/teacher";

interface WordOrderingRendererProps {
    questionText: string;
    orderedWords: string[];
    onComplete: (isCorrect: boolean, answer: string[]) => void;
    supportMode?: boolean;
    hint?: string;
    showHintsSetting?: boolean;
}

export default function WordOrderingRenderer({
    questionText,
    orderedWords,
    onComplete,
    supportMode = true,
    hint,
    showHintsSetting = false,
}: WordOrderingRendererProps) {
    const [shuffledWords, setShuffledWords] = useState<string[]>([]);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [showHint, setShowHint] = useState(false);
    const [isWobbling, setIsWobbling] = useState(false);

    useEffect(() => {
        // Trộn từ ngẫu nhiên
        setShuffledWords([...orderedWords].sort(() => Math.random() - 0.5));
        setSelectedWords([]);
        setShowHint(false);
    }, [orderedWords]);

    const handleWordClick = (word: string, index: number, isFromSelected: boolean) => {
        if (isFromSelected) {
            // Bỏ chọn từ
            setSelectedWords(prev => prev.filter((_, i) => i !== index));
            setShuffledWords(prev => [...prev, word]);
        } else {
            // Chọn từ
            const newSelected = [...selectedWords, word];
            setSelectedWords(newSelected);
            setShuffledWords(prev => prev.filter((_, i) => i !== index));

            // Kiểm tra nếu đã chọn hết từ
            if (newSelected.length === orderedWords.length) {
                const isCorrect = JSON.stringify(newSelected) === JSON.stringify(orderedWords);
                onComplete(isCorrect, newSelected);
                if (!isCorrect) {
                    setIsWobbling(true);
                    setTimeout(() => setIsWobbling(false), 500);
                    if (supportMode) {
                        setShowHint(true);
                    }
                }
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Ô hiển thị câu đang sắp xếp */}
            <motion.div
                animate={isWobbling ? { x: [-10, 10, -10, 10, 0] } : {}}
                className="min-h-[120px] p-6 bg-white border-4 border-slate-800 rounded-[2rem] shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-wrap gap-3 items-center justify-center relative"
            >
                <AnimatePresence>
                    {selectedWords.map((word, index) => (
                        <motion.button
                            key={`selected-${index}-${word}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleWordClick(word, index, true)}
                            className="px-5 py-2 bg-indigo-500 text-white font-black rounded-xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-lg"
                        >
                            {word}
                        </motion.button>
                    ))}
                </AnimatePresence>

                {selectedWords.length === 0 && (
                    <p className="text-slate-400 font-bold italic">Các từ sẽ xuất hiện ở đây khi em chọn...</p>
                )}
            </motion.div>

            {/* Kho từ để chọn */}
            <div className="flex flex-wrap gap-4 justify-center p-6 bg-amber-50 rounded-[2rem] border-4 border-dashed border-amber-300">
                <AnimatePresence>
                    {shuffledWords.map((word, index) => (
                        <motion.button
                            key={`shuffled-${index}-${word}`}
                            layout
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            whileHover={{ y: -5, backgroundColor: "#fef3c7" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleWordClick(word, index, false)}
                            className="px-6 py-3 bg-white text-slate-800 font-black rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xl"
                        >
                            {word}
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            {/* Lời nhắc từ Giáo sư Cú */}
            <AnimatePresence>
                {showHint && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 bg-yellow-100 p-6 rounded-3xl border-4 border-yellow-400 shadow-[4px_4px_0_0_rgba(250,204,21,1)]"
                    >
                        <div className="text-4xl">🦉</div>
                        <div>
                            <p className="font-black text-yellow-800 text-lg">
                                {showHintsSetting && hint ? "🦉 Gợi ý từ Giáo sư Cú:" : "Ối, hiệp sĩ ơi! Còn một chút xíu nữa thôi!"}
                            </p>
                            <p className="font-bold text-yellow-700">
                                {showHintsSetting && hint ? hint : "Lớp mình thử đổi chỗ các từ xem sao nhé. Cố lên nào!"}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
