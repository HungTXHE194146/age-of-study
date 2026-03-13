"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface SubmitConfirmModalProps {
    show: boolean;
    answeredCount: number;
    totalQuestions: number;
    unansweredCount: number;
    onClose: () => void;
    onConfirm: () => void;
}

export default function SubmitConfirmModal({
    show,
    answeredCount,
    totalQuestions,
    unansweredCount,
    onClose,
    onConfirm,
}: SubmitConfirmModalProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.85, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 24 }}
                        className="bg-white rounded-3xl p-8 max-w-md w-full border-4 border-slate-800 shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
                    >
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">📋</div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase mb-2">Nộp bài?</h2>
                            <p className="text-slate-600 font-medium">
                                Bạn đã trả lời <strong className="text-indigo-600">{answeredCount}/{totalQuestions}</strong> câu hỏi.
                            </p>

                            {unansweredCount > 0 && (
                                <div className="mt-4 bg-amber-50 border-2 border-amber-400 rounded-2xl p-4">
                                    <p className="text-amber-800 font-bold">
                                        ⚠️ Còn <strong>{unansweredCount} câu</strong> chưa trả lời. Bạn có chắc muốn nộp không?
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={onClose}
                                className="flex-1 bg-white !text-slate-800 font-black border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all py-3 h-auto text-lg"
                                variant="outline"
                            >
                                Làm tiếp
                            </Button>
                            <Button
                                onClick={onConfirm}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-slate-900 font-black border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all py-3 h-auto text-lg"
                            >
                                Nộp bài ✓
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
