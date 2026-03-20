"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question } from "@/types/teacher";

interface CategorizationRendererProps {
    categoriesData: Array<{ name: string; items: string[] }>;
    onComplete: (isCorrect: boolean, categories: any[]) => void;
    supportMode?: boolean;
    hint?: string;
    showHintsSetting?: boolean;
}

export default function CategorizationRenderer({
    categoriesData,
    onComplete,
    supportMode = true,
    hint,
    showHintsSetting = false,
}: CategorizationRendererProps) {
    const allItems = categoriesData.flatMap(cat => cat.items);

    const [unassignedItems, setUnassignedItems] = useState<string[]>([]);
    const [assignedItems, setAssignedItems] = useState<Record<string, string[]>>({});
    const [isWobbling, setIsWobbling] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        setUnassignedItems([...allItems].sort(() => Math.random() - 0.5));
        const initialAssigned: Record<string, string[]> = {};
        categoriesData.forEach(cat => {
            initialAssigned[cat.name] = [];
        });
        setAssignedItems(initialAssigned);
        setShowHint(false);
    }, [categoriesData]);

    const handleItemClick = (item: string, fromCategory?: string) => {
        if (fromCategory) {
            // Bỏ khỏi nhóm, quay lại kho
            setAssignedItems(prev => ({
                ...prev,
                [fromCategory]: prev[fromCategory].filter(i => i !== item)
            }));
            setUnassignedItems(prev => [...prev, item]);
        } else {
            // Chọn nhóm đầu tiên chưa đầy hoặc nhóm hiện tại đang chọn (đơn giản hóa cho trẻ em bằng cách nhấn vào mục rồi nhấn vào nhóm)
            // Ở đây ta dùng cơ chế đơn giản: Nhấn vào mục -> Chuyển sang nhóm tiếp theo theo vòng tròn
            const categoryNames = categoriesData.map(c => c.name);
            const nextCategory = categoryNames[0]; // Tạm thời mặc định vào nhóm 1, hoặc có thể dùng state selectedCategory

            setUnassignedItems(prev => prev.filter(i => i !== item));
            setAssignedItems(prev => ({
                ...prev,
                [nextCategory]: [...prev[nextCategory], item]
            }));

            checkCompletion({
                ...assignedItems,
                [nextCategory]: [...assignedItems[nextCategory], item]
            });
        }
    };

    // Kéo thả đơn giản bằng cách chọn mục rồi chọn nhóm
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    const handleSelectItem = (item: string) => {
        setSelectedItem(item === selectedItem ? null : item);
    };

    const handleAssignToCategory = (categoryName: string) => {
        if (selectedItem) {
            setUnassignedItems(prev => prev.filter(i => i !== selectedItem));
            const newAssigned = {
                ...assignedItems,
                [categoryName]: [...assignedItems[categoryName], selectedItem]
            };
            setAssignedItems(newAssigned);
            setSelectedItem(null);
            checkCompletion(newAssigned);
        }
    };

    const checkCompletion = (currentAssigned: Record<string, string[]>) => {
        const totalAssigned = Object.values(currentAssigned).flat().length;
        if (totalAssigned === allItems.length) {
            const isAllCorrect = categoriesData.every(cat => {
                const assigned = currentAssigned[cat.name] || [];
                return assigned.length === cat.items.length &&
                    assigned.every(item => cat.items.includes(item));
            });

            const categoriesArray = Object.entries(currentAssigned).map(([name, items]) => ({ name, items }));
            onComplete(isAllCorrect, categoriesArray);

            if (!isAllCorrect) {
                setIsWobbling(true);
                setTimeout(() => setIsWobbling(false), 500);
                if (supportMode) setShowHint(true);
            }
        }
    };

    return (
        <div className="space-y-8 p-4">
            {/* Kho từ chưa phân loại */}
            <div className="p-6 bg-slate-100 rounded-[2.5rem] border-4 border-dashed border-slate-300 min-h-[100px] flex flex-wrap gap-3 justify-center">
                <AnimatePresence>
                    {unassignedItems.map((item, idx) => (
                        <motion.button
                            key={`item-${idx}`}
                            layout
                            initial={{ scale: 0 }}
                            animate={{
                                scale: 1,
                                backgroundColor: selectedItem === item ? "#6366f1" : "white",
                                color: selectedItem === item ? "white" : "#1e293b"
                            }}
                            exit={{ scale: 0 }}
                            onClick={() => handleSelectItem(item)}
                            className="px-5 py-3 font-black rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-lg"
                        >
                            {item}
                        </motion.button>
                    ))}
                </AnimatePresence>
                {unassignedItems.length === 0 && <p className="text-slate-400 font-bold italic">Đã hết từ rồi!</p>}
            </div>

            {/* Các nhóm phân loại */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categoriesData.map((cat, idx) => (
                    <motion.div
                        key={`cat-${idx}`}
                        onClick={() => handleAssignToCategory(cat.name)}
                        animate={isWobbling && assignedItems[cat.name]?.length > 0 ? { x: [-5, 5, -5, 5, 0] } : {}}
                        className={`p-6 rounded-[2.5rem] border-4 min-h-[200px] transition-colors cursor-pointer
              ${selectedItem ? "border-indigo-400 bg-indigo-50 border-dashed" : "border-slate-800 bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)]"}`}
                    >
                        <h3 className="text-center text-xl font-black text-slate-800 mb-4 uppercase tracking-wider">
                            {cat.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {assignedItems[cat.name]?.map((item, iIdx) => (
                                <motion.button
                                    key={`assigned-${iIdx}`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleItemClick(item, cat.name);
                                    }}
                                    className="px-4 py-2 bg-white border-2 border-slate-800 rounded-xl font-bold text-slate-700 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                >
                                    {item}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {showHint && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 bg-purple-100 p-6 rounded-3xl border-4 border-purple-400 text-purple-900"
                    >
                        <div className="text-4xl">🦉</div>
                        <p className="font-black italic text-lg">
                            {showHintsSetting && hint
                                ? hint
                                : '"Bạn nhỏ ơi, mình hãy xem kỹ lại các nhóm từ nhé. Một vài từ đang đi nhầm nhà kìa!"'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
