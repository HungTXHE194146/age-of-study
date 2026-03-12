import { useState } from "react";
import { Question } from "@/types/teacher";

interface ManualQuestionTabProps {
    questionsLength: number;
    onAddQuestion: (question: Question) => void;
}

export function ManualQuestionTab({ questionsLength, onAddQuestion }: ManualQuestionTabProps) {
    const [manualQuestionType, setManualQuestionType] = useState<
        "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" | "WORD_ORDERING" | "MATCHING" | "FILL_IN_BLANKS" | "CATEGORIZATION" | "FIND_ERROR"
    >("MULTIPLE_CHOICE");


    const [manualQuestionText, setManualQuestionText] = useState("");
    const [manualDifficulty, setManualDifficulty] = useState<
        "Easy" | "Medium" | "Hard"
    >("Medium");
    const [manualOptions, setManualOptions] = useState([
        { id: "1", label: "A", text: "", isCorrect: false },
        { id: "2", label: "B", text: "", isCorrect: false },
        { id: "3", label: "C", text: "", isCorrect: false },
        { id: "4", label: "D", text: "", isCorrect: false },
    ]);
    const [manualCorrectAnswer, setManualCorrectAnswer] = useState("A");
    const [manualTrueFalseContent, setManualTrueFalseContent] = useState({
        true: "",
        false: "",
    });
    const [manualTrueFalseCorrectAnswer, setManualTrueFalseCorrectAnswer] =
        useState<"TRUE" | "FALSE">("TRUE");
    const [manualEssayHint, setManualEssayHint] = useState("");
    const [manualExplanation, setManualExplanation] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);

    // New question types states
    const [orderedWordsStr, setOrderedWordsStr] = useState("");
    const [matchingPairs, setMatchingPairs] = useState([{ left: "", right: "" }]);
    const [blanksStr, setBlanksStr] = useState("");
    const [categories, setCategories] = useState([{ name: "", items: "" }]);
    const [findErrorData, setFindErrorData] = useState({ startIndex: 0, endIndex: 0, correctText: "" });

    const [blanksSentence, setBlanksSentence] = useState("");
    const [errorSentence, setErrorSentence] = useState("");



    const handleAddClick = () => {
        // Validate required fields
        if (!manualQuestionText.trim()) {
            alert("Vui lòng nhập nội dung câu hỏi");
            return;
        }

        if (manualQuestionType === "MULTIPLE_CHOICE") {
            const hasEmptyOptions = manualOptions.some((option) => !option.text.trim());
            if (hasEmptyOptions) {
                alert("Vui lòng nhập đầy đủ nội dung cho ít nhất 2 phương án đầu tiên");
                return;
            }
        }

        // Create question object
        const newQuestion: Question = {
            id: Date.now().toString(),
            createdAt: Date.now(),
            number: questionsLength + 1,
            type: manualQuestionType,
            questionText: manualQuestionText,
            options:
                manualQuestionType === "MULTIPLE_CHOICE"
                    ? manualOptions.map((option) => ({
                        ...option,
                        isCorrect: option.label === manualCorrectAnswer,
                    }))
                    : manualQuestionType === "TRUE_FALSE"
                        ? [
                            {
                                id: "1",
                                label: "A",
                                text: manualTrueFalseContent.true || "Đúng",
                                isCorrect: manualTrueFalseCorrectAnswer === "TRUE",
                            },
                            {
                                id: "2",
                                label: "B",
                                text: manualTrueFalseContent.false || "Sai",
                                isCorrect: manualTrueFalseCorrectAnswer === "FALSE",
                            },
                        ]
                        : [],
            difficulty: manualDifficulty,
            explanation: manualExplanation || undefined,
            metadata: manualQuestionType === "WORD_ORDERING"
                ? { orderedWords: orderedWordsStr.split(",").map(s => s.trim()).filter(Boolean) }
                : manualQuestionType === "MATCHING"
                    ? { matchingPairs: matchingPairs.filter(p => p.left && p.right) }
                    : manualQuestionType === "FILL_IN_BLANKS"
                        ? {
                            sentence: blanksSentence,
                            blanks: blanksStr.split(",").map((s, i) => ({ index: i, answer: s.trim() })).filter(b => b.answer)
                        }
                        : manualQuestionType === "CATEGORIZATION"
                            ? { categories: categories.map(c => ({ name: c.name, items: c.items.split(",").map(s => s.trim()).filter(Boolean) })).filter(c => c.name) }
                            : manualQuestionType === "FIND_ERROR"
                                ? {
                                    sentence: errorSentence,
                                    errorPosition: findErrorData
                                }
                                : undefined
        };


        onAddQuestion(newQuestion);

        // Reset form
        setManualQuestionText("");
        setManualOptions([
            { id: "1", label: "A", text: "", isCorrect: false },
            { id: "2", label: "B", text: "", isCorrect: false },
            { id: "3", label: "C", text: "", isCorrect: false },
            { id: "4", label: "D", text: "", isCorrect: false },
        ]);
        setManualCorrectAnswer("A");
        setManualTrueFalseContent({ true: "", false: "" });
        setManualEssayHint("");
        setManualExplanation("");
        setOrderedWordsStr("");
        setMatchingPairs([{ left: "", right: "" }]);
        setBlanksStr("");
        setBlanksSentence("");
        setErrorSentence("");
        setCategories([{ name: "", items: "" }]);
        setFindErrorData({ startIndex: 0, endIndex: 0, correctText: "" });
    };



    return (
        <div className="space-y-4">
            <div className="grid gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                        Lời dẫn / Hướng dẫn làm bài (Câu {questionsLength + 1})
                    </label>
                    <textarea
                        rows={2}
                        value={manualQuestionText}
                        onChange={(e) => setManualQuestionText(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                        placeholder="Ví dụ: Tìm lỗi sai trong câu sau, Sắp xếp các từ..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                            Loại câu hỏi
                        </label>
                        <select
                            value={manualQuestionType}
                            onChange={(e) =>
                                setManualQuestionType(
                                    e.target.value as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" | "WORD_ORDERING" | "MATCHING" | "FILL_IN_BLANKS" | "CATEGORIZATION" | "FIND_ERROR"
                                )
                            }
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                        >
                            <option value="MULTIPLE_CHOICE">Trắc nghiệm (4 lựa chọn)</option>
                            <option value="TRUE_FALSE">Đúng / Sai</option>
                            <option value="ESSAY">Tự luận / Trả lời ngắn</option>
                            <option value="WORD_ORDERING">Sắp xếp từ</option>
                            <option value="MATCHING">Nối cặp (Matching)</option>
                            <option value="FILL_IN_BLANKS">Điền vào chỗ trống</option>
                            <option value="CATEGORIZATION">Phân loại (Categorization)</option>
                            <option value="FIND_ERROR">Tìm lỗi sai</option>


                        </select>
                    </div>

                    {showAdvanced ? (
                        <div>
                            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                                Độ khó
                            </label>
                            <select
                                value={manualDifficulty}
                                onChange={(e) =>
                                    setManualDifficulty(
                                        e.target.value as "Easy" | "Medium" | "Hard"
                                    )
                                }
                                className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                            >
                                <option value="Easy">Dễ</option>
                                <option value="Medium">Trung bình</option>
                                <option value="Hard">Khó</option>
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-end pb-3">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(true)}
                                className="text-blue-600 font-bold text-sm hover:underline"
                            >
                                + Hiện thêm cài đặt (Độ khó, giải thích...)
                            </button>
                        </div>
                    )}
                </div>

                {/* Multiple Choice Options */}
                {manualQuestionType === "MULTIPLE_CHOICE" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {manualOptions.map((option, index) => (
                                <div key={option.id} className="relative">
                                    <div className={`absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center font-black border-r-2 border-black ${manualCorrectAnswer === option.label ? 'bg-green-400' : 'bg-gray-100'}`}>
                                        {option.label}
                                    </div>
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => {
                                            const updatedOptions = [...manualOptions];
                                            updatedOptions[index] = {
                                                ...option,
                                                text: e.target.value,
                                            };
                                            setManualOptions(updatedOptions);
                                        }}
                                        className={`w-full pl-16 pr-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all ${manualCorrectAnswer === option.label ? 'border-green-600 bg-green-50' : ''}`}
                                        placeholder={`Phương án ${option.label}...`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setManualCorrectAnswer(option.label)}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-black rounded border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] ${manualCorrectAnswer === option.label ? 'bg-green-500 text-white' : 'bg-white text-gray-400'}`}
                                    >
                                        ĐÚNG
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* True/False Options */}
                {manualQuestionType === "TRUE_FALSE" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['TRUE', 'FALSE'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setManualTrueFalseCorrectAnswer(type as 'TRUE' | 'FALSE')}
                                className={`p-4 border-2 border-black rounded-xl font-black text-xl transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${manualTrueFalseCorrectAnswer === type ? (type === 'TRUE' ? 'bg-green-400 translate-x-1 translate-y-1 shadow-none' : 'bg-red-400 translate-x-1 translate-y-1 shadow-none') : 'bg-white hover:-translate-y-1'}`}
                            >
                                {type === 'TRUE' ? '👍 ĐÚNG' : '👎 SAI'}
                            </button>
                        ))}
                    </div>
                )}

                {/* Essay Question */}
                {manualQuestionType === "ESSAY" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-800 uppercase">
                            Hướng dẫn / Đáp án mẫu
                        </label>
                        <textarea
                            rows={3}
                            value={manualEssayHint}
                            onChange={(e) => setManualEssayHint(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 border-dashed"
                            placeholder="Nhập nội dung đáp án hoặc hướng dẫn chấm bài..."
                        />
                    </div>
                )}

                {/* Word Ordering */}
                {manualQuestionType === "WORD_ORDERING" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-800 uppercase">
                            Danh sách từ theo thứ tự đúng (Cách nhau bằng dấu phẩy)
                        </label>
                        <input
                            type="text"
                            value={orderedWordsStr}
                            onChange={(e) => setOrderedWordsStr(e.target.value)}
                            placeholder="Con, mèo, trèo, cây, cau"
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold"
                        />
                    </div>
                )}

                {/* Matching Pairs */}
                {manualQuestionType === "MATCHING" && (
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-800 uppercase">
                            Các cặp nối (Cột trái - Cột phải)
                        </label>
                        {matchingPairs.map((pair, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    type="text"
                                    value={pair.left}
                                    onChange={(e) => {
                                        const newPairs = [...matchingPairs];
                                        newPairs[idx].left = e.target.value;
                                        setMatchingPairs(newPairs);
                                    }}
                                    placeholder="Trái..."
                                    className="flex-1 px-4 py-2 bg-white border-2 border-slate-800 rounded-lg font-bold"
                                />
                                <input
                                    type="text"
                                    value={pair.right}
                                    onChange={(e) => {
                                        const newPairs = [...matchingPairs];
                                        newPairs[idx].right = e.target.value;
                                        setMatchingPairs(newPairs);
                                    }}
                                    placeholder="Phải..."
                                    className="flex-1 px-4 py-2 bg-white border-2 border-slate-800 rounded-lg font-bold"
                                />
                                <button
                                    onClick={() => setMatchingPairs(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-red-500 font-black px-2"
                                >✕</button>
                            </div>
                        ))}
                        <button
                            onClick={() => setMatchingPairs([...matchingPairs, { left: "", right: "" }])}
                            className="text-sm font-bold text-blue-600"
                        >+ Thêm cặp mới</button>
                    </div>
                )}

                {/* Fill in Blanks */}
                {manualQuestionType === "FILL_IN_BLANKS" && (
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-800 uppercase">
                            Nội dung câu văn (Sử dụng ___ cho chỗ trống)
                        </label>
                        <textarea
                            rows={2}
                            value={blanksSentence}
                            onChange={(e) => setBlanksSentence(e.target.value)}
                            placeholder="Ví dụ: Bác Hồ sinh ngày ___ tháng ___ năm 1890."
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900"
                        />
                        <label className="block text-sm font-bold text-gray-800 uppercase mt-4">
                            Đáp án các ô trống (Cách nhau bằng dấu phẩy)
                        </label>
                        <input
                            type="text"
                            value={blanksStr}
                            onChange={(e) => setBlanksStr(e.target.value)}
                            placeholder="19, 5"
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold"
                        />
                        <p className="text-xs text-slate-500 italic">* Các đáp án sẽ được gán vào các ___ theo thứ tự từ trái sang phải.</p>
                    </div>
                )}

                {/* Categorization */}
                {manualQuestionType === "CATEGORIZATION" && (
                    <div className="space-y-6">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="p-4 border-2 border-slate-800 rounded-xl space-y-3 bg-slate-50">
                                <div className="flex justify-between">
                                    <input
                                        type="text"
                                        value={cat.name}
                                        onChange={(e) => {
                                            const newCats = [...categories];
                                            newCats[idx].name = e.target.value;
                                            setCategories(newCats);
                                        }}
                                        placeholder="Tên nhóm (ví dụ: Danh từ)"
                                        className="flex-1 px-4 py-2 bg-white border-2 border-slate-800 rounded-lg font-black"
                                    />
                                    <button
                                        onClick={() => setCategories(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-red-500 ml-4 font-black"
                                    >✕</button>
                                </div>
                                <input
                                    type="text"
                                    value={cat.items}
                                    onChange={(e) => {
                                        const newCats = [...categories];
                                        newCats[idx].items = e.target.value;
                                        setCategories(newCats);
                                    }}
                                    placeholder="Các từ trong nhóm (cách nhau bằng dấu phẩy)"
                                    className="w-full px-4 py-2 bg-white border-2 border-slate-300 rounded-lg font-bold"
                                />
                            </div>
                        ))}
                        <button
                            onClick={() => setCategories([...categories, { name: "", items: "" }])}
                            className="text-sm font-bold text-blue-600"
                        >+ Thêm nhóm mới</button>
                    </div>
                )}

                {/* Find Error */}
                {manualQuestionType === "FIND_ERROR" && (
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-800 uppercase">
                            Câu văn chứa lỗi sai
                        </label>
                        <textarea
                            rows={2}
                            value={errorSentence}
                            onChange={(e) => setErrorSentence(e.target.value)}
                            placeholder="Nhập câu văn chứa lỗi sai tại đây..."
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900"
                        />
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-500">Chọn từ sai trong câu dưới đây:</label>
                            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-wrap gap-2">
                                {errorSentence.split(/(\s+)/).map((part, idx, arr) => {
                                    if (part.trim().length === 0) return null;

                                    let currentPos = 0;
                                    for (let i = 0; i < idx; i++) {
                                        currentPos += arr[i].length;
                                    }

                                    const isSelected =
                                        findErrorData.startIndex === currentPos &&
                                        findErrorData.endIndex === (currentPos + part.length - 1);

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setFindErrorData({
                                                    ...findErrorData,
                                                    startIndex: currentPos,
                                                    endIndex: currentPos + part.length - 1
                                                });
                                            }}
                                            className={`px-2 py-1 rounded-md border-2 font-bold transition-all ${isSelected
                                                ? "bg-red-500 text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                                : "bg-white border-gray-300 hover:border-black"
                                                }`}
                                        >
                                            {part}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-slate-400 italic font-medium">* Nhấn vào từ chứa lỗi sai để đánh dấu</p>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500">Từ đúng (Để sửa lại)</label>
                            <input
                                type="text"
                                value={findErrorData.correctText}
                                onChange={(e) => setFindErrorData({ ...findErrorData, correctText: e.target.value })}
                                placeholder="Ví dụ: 'học' thay vì 'họck'..."
                                className="w-full px-4 py-2 border-2 border-slate-800 rounded-lg"
                            />
                        </div>
                    </div>
                )}


                {/* Advanced Explanation */}
                {showAdvanced && (
                    <div className="pt-4 border-t-2 border-dashed border-gray-200">
                        <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                            Giải thích chi tiết (Hiện sau khi học sinh nộp bài)
                        </label>
                        <textarea
                            rows={2}
                            value={manualExplanation}
                            onChange={(e) => setManualExplanation(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 border-dashed"
                            placeholder="Vì sao đáp án này đúng? Giải thích ngắn gọn..."
                        />
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(false)}
                            className="mt-2 text-gray-500 text-xs font-bold hover:underline"
                        >
                            Thu gọn cài đặt nâng cao
                        </button>
                    </div>
                )}

                <button
                    onClick={handleAddClick}
                    className="w-full px-4 py-4 bg-green-500 text-white font-black border-2 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-green-400 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <span className="text-2xl">+</span> LƯU CÂU HỎI NÀY
                </button>
            </div>
        </div>
    );
}
