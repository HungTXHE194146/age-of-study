"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FindErrorRendererProps {
    questionText: string;
    errorPosition: { startIndex: number; endIndex: number; correctText: string };
    onComplete: (isCorrect: boolean, selectedText: string) => void;
    supportMode?: boolean;
    hint?: string;
    showHintsSetting?: boolean;
}

export default function FindErrorRenderer({
    questionText,
    errorPosition,
    onComplete,
    supportMode = true,
    hint,
    showHintsSetting = false,
}: FindErrorRendererProps) {
    const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
    const [isWobbling, setIsWobbling] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const getSelectableChunks = () => {
        const { startIndex, endIndex } = errorPosition;

        // Tự động "nắn" vị trí lỗi về biên của từ (Word boundary snapping)
        // Điều này giúp sửa lỗi các chỉ số bị lệch từ AI (ví dụ: từ "c chuy" thành "chuyện")
        let snappedStart = startIndex;
        while (snappedStart > 0 && questionText[snappedStart - 1] !== ' ' && questionText[snappedStart - 1] !== '\n') {
            snappedStart--;
        }

        let snappedEnd = endIndex;
        while (snappedEnd < questionText.length - 1 && questionText[snappedEnd + 1] !== ' ' && questionText[snappedEnd + 1] !== '\n') {
            snappedEnd++;
        }

        const chunks: { text: string; start: number; end: number; isErrorPart: boolean }[] = [];

        // Phần văn bản trước, trong và sau lỗi
        const textBefore = questionText.substring(0, snappedStart);
        const errorPart = questionText.substring(snappedStart, snappedEnd + 1);
        const textAfter = questionText.substring(snappedEnd + 1);

        const addNormalSegments = (text: string, offset: number) => {
            const parts = text.split(/(\s+)/);
            let currentOffset = offset;
            parts.forEach(p => {
                if (p.trim().length > 0) {
                    chunks.push({
                        text: p,
                        start: currentOffset,
                        end: currentOffset + p.length - 1,
                        isErrorPart: false
                    });
                }
                currentOffset += p.length;
            });
        };

        addNormalSegments(textBefore, 0);

        if (errorPart.length > 0) {
            chunks.push({
                text: errorPart,
                start: snappedStart,
                end: snappedEnd,
                isErrorPart: true
            });
        }

        addNormalSegments(textAfter, snappedEnd + 1);

        return chunks;
    };

    const selectableChunks = getSelectableChunks();

    useEffect(() => {
        setSelectedWordIndex(null);
        setShowHint(false);
    }, [questionText]);

    const handleChunkClick = (index: number, chunk: any) => {
        setSelectedWordIndex(index);

        onComplete(chunk.isErrorPart, chunk.text);

        if (!chunk.isErrorPart) {
            setIsWobbling(true);
            setTimeout(() => setIsWobbling(false), 500);
            if (supportMode) setShowHint(true);
        }
    };

    return (
        <div className="space-y-6">
            <div className={`p-8 bg-white border-4 border-black rounded-[2rem] shadow-[10px_10px_0_0_rgba(0,0,0,1)] transition-transform ${isWobbling ? 'animate-shake' : ''}`}>
                <div className="text-2xl font-bold leading-[2.5] text-slate-800 tracking-wide text-pretty">
                    {selectableChunks.map((chunk, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleChunkClick(idx, chunk)}
                            className={`inline-block px-2 mx-0.5 rounded-md transition-all cursor-pointer hover:bg-sky-100 hover:scale-105
                ${selectedWordIndex === idx
                                    ? "bg-amber-400 text-black ring-2 ring-black"
                                    : ""}`}
                        >
                            {chunk.text}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {showHint && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-sky-100 p-6 rounded-[2rem] border-4 border-sky-400 shadow-[4px_4px_0_0_rgba(56,189,248,1)] flex items-center gap-4"
                    >
                        <div className="text-4xl">🦉</div>
                        <p className="font-black text-sky-800 italic text-lg">
                            {showHintsSetting && hint
                                ? hint
                                : '"Thám tử nhí ơi, hãy quan sát thật kỹ từng từ nhé! Có một lỗi nhỏ đang trốn ở đâu đó đấy."'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

